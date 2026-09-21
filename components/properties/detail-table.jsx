"use client";

import { Badge, Table, Text } from "@chakra-ui/react";

export function DetailTable({
  table,
  highlightId,
  emptyLabel = "Tidak ada data.",
}) {
  if (!table || table.rows.length === 0) {
    return (
      <Text fontSize="xs" color="fg.muted" py={2}>
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Table.ScrollArea
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.panel"
    >
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            {table.columns.map((column) => (
              <Table.ColumnHeader
                key={column.key}
                position="sticky"
                top="0"
                zIndex={1}
                bg="bg.muted"
                fontSize="10px"
                textTransform="uppercase"
                color="fg.muted"
                whiteSpace="nowrap"
                px="2"
                py="1.5"
              >
                {column.label}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {table.rows.map((row) => {
            const highlighted =
              highlightId != null && String(row.id) === String(highlightId);
            return (
              <Table.Row
                key={row.key}
                bg={highlighted ? "blue.subtle" : undefined}
                _hover={{ bg: highlighted ? "blue.subtle" : "bg.muted" }}
              >
                {table.columns.map((column) => {
                  const raw = row.cells[column.key];
                  const text = column.format ? column.format(raw) : raw ?? "-";
                  const tone = column.tone ? column.tone(raw) : null;
                  return (
                    <Table.Cell
                      key={column.key}
                      fontSize="11px"
                      whiteSpace="nowrap"
                      color="fg"
                      px="2"
                      py="1"
                    >
                      {tone ? (
                        <Badge size="sm" variant="subtle" colorPalette={tone}>
                          {text}
                        </Badge>
                      ) : (
                        text
                      )}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
