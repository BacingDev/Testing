BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS workflow;
SET search_path TO workflow, public;

CREATE TYPE port_type AS ENUM ('PORT', 'VIRTUAL', 'EXPOSED');
CREATE TYPE declared_direction AS ENUM ('NEUTRAL', 'INLET', 'OUTLET');

CREATE TABLE canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canvases_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE TABLE canvas_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  client_key text NOT NULL,
  node_type text NOT NULL DEFAULT 'workflow',
  label text NOT NULL,
  image text,
  position_x double precision NOT NULL,
  position_y double precision NOT NULL,
  width double precision NOT NULL,
  height double precision NOT NULL,
  z_index integer NOT NULL DEFAULT 10,
  is_visible boolean NOT NULL DEFAULT true,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canvas_nodes_client_key_not_blank CHECK (length(trim(client_key)) > 0),
  CONSTRAINT canvas_nodes_type_not_blank CHECK (length(trim(node_type)) > 0),
  CONSTRAINT canvas_nodes_label_not_blank CHECK (length(trim(label)) > 0),
  CONSTRAINT canvas_nodes_width_positive CHECK (width > 0),
  CONSTRAINT canvas_nodes_height_positive CHECK (height > 0),
  CONSTRAINT canvas_nodes_style_object CHECK (jsonb_typeof(style) = 'object'),
  CONSTRAINT canvas_nodes_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  UNIQUE (canvas_id, client_key)
);

CREATE INDEX canvas_nodes_canvas_idx ON canvas_nodes (canvas_id);

CREATE TABLE canvas_ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  client_key text NOT NULL,
  name text NOT NULL,
  port_type port_type NOT NULL DEFAULT 'PORT',
  side smallint NOT NULL,
  position numeric(7, 3) NOT NULL,
  direction declared_direction NOT NULL DEFAULT 'NEUTRAL',
  has_metadata boolean NOT NULL DEFAULT false,
  remark text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canvas_ports_client_key_not_blank CHECK (length(trim(client_key)) > 0),
  CONSTRAINT canvas_ports_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT canvas_ports_side_valid CHECK (side BETWEEN 0 AND 3),
  CONSTRAINT canvas_ports_position_valid CHECK (position BETWEEN 0 AND 100),
  UNIQUE (node_id, client_key)
);

CREATE INDEX canvas_ports_node_idx ON canvas_ports (node_id);
CREATE INDEX canvas_ports_node_side_idx ON canvas_ports (node_id, side);

CREATE TABLE canvas_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  client_key text NOT NULL,
  source_port_id uuid NOT NULL,
  target_port_id uuid NOT NULL,
  color text NOT NULL DEFAULT '#111827',
  stroke_width double precision NOT NULL DEFAULT 1,
  animated boolean NOT NULL DEFAULT false,
  remark text,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  marker_end jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  waypoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canvas_edges_client_key_not_blank CHECK (length(trim(client_key)) > 0),
  CONSTRAINT canvas_edges_ports_different CHECK (source_port_id <> target_port_id),
  CONSTRAINT canvas_edges_stroke_width_positive CHECK (stroke_width > 0),
  CONSTRAINT canvas_edges_style_object CHECK (jsonb_typeof(style) = 'object'),
  CONSTRAINT canvas_edges_marker_object CHECK (jsonb_typeof(marker_end) = 'object'),
  CONSTRAINT canvas_edges_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT canvas_edges_waypoints_array CHECK (jsonb_typeof(waypoints) = 'array'),
  CONSTRAINT canvas_edges_source_port_fk
    FOREIGN KEY (source_port_id)
    REFERENCES canvas_ports(id)
    ON DELETE CASCADE,
  CONSTRAINT canvas_edges_target_port_fk
    FOREIGN KEY (target_port_id)
    REFERENCES canvas_ports(id)
    ON DELETE CASCADE,
  UNIQUE (canvas_id, client_key)
);

CREATE INDEX canvas_edges_canvas_idx ON canvas_edges (canvas_id);
CREATE INDEX canvas_edges_source_port_idx ON canvas_edges (source_port_id);
CREATE INDEX canvas_edges_target_port_idx ON canvas_edges (target_port_id);

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER canvases_set_updated_at
BEFORE UPDATE ON canvases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER canvas_nodes_set_updated_at
BEFORE UPDATE ON canvas_nodes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER canvas_ports_set_updated_at
BEFORE UPDATE ON canvas_ports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER canvas_edges_set_updated_at
BEFORE UPDATE ON canvas_edges
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE FUNCTION validate_canvas_edge_endpoints()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_node_id uuid;
  target_node_id uuid;
  source_canvas_id uuid;
  target_canvas_id uuid;
  source_port_kind port_type;
  target_port_kind port_type;
BEGIN
  SELECT p.node_id, n.canvas_id, p.port_type
  INTO source_node_id, source_canvas_id, source_port_kind
  FROM canvas_ports p
  JOIN canvas_nodes n ON n.id = p.node_id
  WHERE p.id = NEW.source_port_id;

  SELECT p.node_id, n.canvas_id, p.port_type
  INTO target_node_id, target_canvas_id, target_port_kind
  FROM canvas_ports p
  JOIN canvas_nodes n ON n.id = p.node_id
  WHERE p.id = NEW.target_port_id;

  IF source_node_id IS NULL OR target_node_id IS NULL THEN
    RAISE EXCEPTION 'Endpoint edge tidak ditemukan'
      USING ERRCODE = '23503';
  END IF;

  IF source_canvas_id <> NEW.canvas_id OR target_canvas_id <> NEW.canvas_id THEN
    RAISE EXCEPTION 'Node dan edge harus berada dalam canvas yang sama'
      USING ERRCODE = '23514';
  END IF;

  IF source_node_id = target_node_id THEN
    RAISE EXCEPTION 'Self-loop tidak diizinkan'
      USING ERRCODE = '23514';
  END IF;

  IF source_port_kind <> 'PORT' OR target_port_kind <> 'PORT' THEN
    RAISE EXCEPTION 'Edge hanya dapat menggunakan port reguler'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER canvas_edges_validate_endpoints
BEFORE INSERT OR UPDATE OF canvas_id, source_port_id, target_port_id
ON canvas_edges
FOR EACH ROW EXECUTE FUNCTION validate_canvas_edge_endpoints();

CREATE VIEW port_connection_summary AS
SELECT
  p.id AS port_id,
  p.node_id,
  n.canvas_id,
  p.client_key AS port_key,
  p.direction AS declared_direction,
  count(e.source_port_id)::integer AS outgoing_edge_count,
  count(e.target_port_id)::integer AS incoming_edge_count,
  CASE
    WHEN count(e.source_port_id) > 0 AND count(e.target_port_id) > 0 THEN 'NEUTRAL'
    WHEN count(e.source_port_id) > 0 THEN 'OUTLET'
    WHEN count(e.target_port_id) > 0 THEN 'INLET'
    ELSE 'NEUTRAL'
  END::declared_direction AS effective_direction,
  (count(e.source_port_id) + count(e.target_port_id)) > 0 AS connected
FROM canvas_ports p
JOIN canvas_nodes n ON n.id = p.node_id
LEFT JOIN canvas_edges e
  ON e.source_port_id = p.id OR e.target_port_id = p.id
GROUP BY
  p.id,
  p.node_id,
  n.canvas_id,
  p.client_key,
  p.direction;

COMMIT;
