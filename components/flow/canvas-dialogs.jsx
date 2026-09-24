"use client";

import { useUpdateNodeInternals } from "@xyflow/react";
import { useGraphStore } from "@/stores/graph-store";
import { ConfirmDeleteDialog } from "@/components/flow/confirm-delete-dialog";
import { EdgePropertiesDialog } from "@/components/flow/edge";
import { NodePropertiesDialog } from "@/components/flow/node";
import { PortPropertiesDialog } from "@/components/flow/port";

function nodeLabel(node) {
  return node?.data?.label ?? node?.id ?? "-";
}

function findPort(node, portId) {
  return (node?.data?.ports ?? []).find(
    (port) => String(port.idpfport) === String(portId),
  );
}

function portLabel(port) {
  return port?.name || `Port ${port?.idpfport ?? "-"}`;
}

function endpointLabel(nodes, nodeId, handle) {
  const node = nodes.find((item) => item.id === nodeId);
  const port = findPort(node, handle);
  const base = nodeLabel(node);
  return port ? `${base} · ${portLabel(port)}` : base;
}

function isDialogOpen(details) {
  return typeof details === "boolean" ? details : details?.open;
}

/**
 * Orkestrasi dialog properti & hapus untuk node, edge, dan port.
 *
 * Sengaja hanya di-mount saat ada target aktif supaya tidak ikut re-render
 * tiap frame ketika node di-drag (store nodes/edges berubah terus).
 */
export function CanvasItemDialogs({
  editing,
  deleting,
  onCloseEditing,
  onCloseDeleting,
}) {
  if (!editing && !deleting) return null;
  return (
    <CanvasItemDialogsInner
      editing={editing}
      deleting={deleting}
      onCloseEditing={onCloseEditing}
      onCloseDeleting={onCloseDeleting}
    />
  );
}

function CanvasItemDialogsInner({
  editing,
  deleting,
  onCloseEditing,
  onCloseDeleting,
}) {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const updateNodeData = useGraphStore((state) => state.updateNodeData);
  const updateNodeStyle = useGraphStore((state) => state.updateNodeStyle);
  const updateEdge = useGraphStore((state) => state.updateEdge);
  const updateEdgeData = useGraphStore((state) => state.updateEdgeData);
  const updateEdgeStyle = useGraphStore((state) => state.updateEdgeStyle);
  const updatePort = useGraphStore((state) => state.updatePort);
  const removeNode = useGraphStore((state) => state.removeNode);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const removePort = useGraphStore((state) => state.removePort);
  const updateNodeInternals = useUpdateNodeInternals();

  const editNode =
    editing?.kind === "node"
      ? nodes.find((node) => node.id === editing.id)
      : null;
  const editEdge =
    editing?.kind === "edge"
      ? edges.find((edge) => edge.id === editing.id)
      : null;
  const editPortNode =
    editing?.kind === "port"
      ? nodes.find((node) => node.id === editing.nodeId)
      : null;
  const editPort = editPortNode ? findPort(editPortNode, editing.portId) : null;

  const deleteNode =
    deleting?.kind === "node"
      ? nodes.find((node) => node.id === deleting.id)
      : null;
  const deleteEdge =
    deleting?.kind === "edge"
      ? edges.find((edge) => edge.id === deleting.id)
      : null;
  const deletePortNode =
    deleting?.kind === "port"
      ? nodes.find((node) => node.id === deleting.nodeId)
      : null;
  const deletePort = deletePortNode
    ? findPort(deletePortNode, deleting.portId)
    : null;

  const handleSaveNode = (id, { label, image, shown, style }) => {
    updateNodeData(id, { label, image, shown });
    updateNodeStyle(id, style);
    onCloseEditing();
  };

  const handleSaveEdge = (id, { animated, strokeWidth, stroke, remark }) => {
    updateEdge(id, { animated });
    updateEdgeStyle(id, { strokeWidth, stroke });
    updateEdgeData(id, { remark });
    onCloseEditing();
  };

  const handleSavePort = (nodeId, portId, patch) => {
    updatePort(nodeId, portId, patch);
    requestAnimationFrame(() => {
      updateNodeInternals([nodeId]);
      requestAnimationFrame(() => updateNodeInternals([nodeId]));
    });
    onCloseEditing();
  };

  const handleConfirmDelete = () => {
    if (deleting?.kind === "node") removeNode(deleting.id);
    if (deleting?.kind === "edge") removeEdge(deleting.id);
    if (deleting?.kind === "port") {
      removePort(deleting.nodeId, deleting.portId);
      requestAnimationFrame(() => {
        updateNodeInternals([deleting.nodeId]);
        requestAnimationFrame(() => updateNodeInternals([deleting.nodeId]));
      });
    }
    onCloseDeleting();
  };

  const deleteInfo = (() => {
    if (deleteNode) {
      return {
        title: "Hapus node?",
        name: nodeLabel(deleteNode),
        description:
          "beserta edge yang terhubung akan dihapus. Tindakan ini tidak dapat dibatalkan.",
      };
    }
    if (deleteEdge) {
      return {
        title: "Hapus edge?",
        name: `#${deleteEdge.id}`,
        description: `(${endpointLabel(nodes, deleteEdge.source, deleteEdge.sourceHandle)} → ${endpointLabel(nodes, deleteEdge.target, deleteEdge.targetHandle)}) akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
      };
    }
    if (deletePort && deletePortNode) {
      return {
        title: "Hapus port?",
        name: portLabel(deletePort),
        description: `pada node ${nodeLabel(deletePortNode)} beserta edge yang terhubung akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
      };
    }
    return null;
  })();

  return (
    <>
      <NodePropertiesDialog
        node={editNode}
        open={!!editNode}
        onOpenChange={(details) => {
          if (isDialogOpen(details) === false) onCloseEditing();
        }}
        onSave={handleSaveNode}
      />

      <PortPropertiesDialog
        node={editPortNode}
        port={editPort}
        open={!!editPort}
        onOpenChange={(details) => {
          if (isDialogOpen(details) === false) onCloseEditing();
        }}
        onSave={handleSavePort}
      />

      <EdgePropertiesDialog
        edge={editEdge}
        from={
          editEdge
            ? endpointLabel(nodes, editEdge.source, editEdge.sourceHandle)
            : ""
        }
        to={
          editEdge
            ? endpointLabel(nodes, editEdge.target, editEdge.targetHandle)
            : ""
        }
        waypointCount={editEdge?.data?.points?.length ?? 0}
        open={!!editEdge}
        onOpenChange={(details) => {
          if (isDialogOpen(details) === false) onCloseEditing();
        }}
        onSave={handleSaveEdge}
      />

      <ConfirmDeleteDialog
        open={!!deleteInfo}
        title={deleteInfo?.title}
        name={deleteInfo?.name}
        description={deleteInfo?.description}
        onOpenChange={(details) => {
          if (isDialogOpen(details) === false) onCloseDeleting();
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
