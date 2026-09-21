"use client";

import { memo } from "react";
import { Box, Table } from "@chakra-ui/react";

export const CanvasTable = memo(function CanvasTable({
  rows,
  selectedKeys,
  onSelect,
}) {
  return (
    <Box
      height="100%"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.panel"
      overflow="hidden"
    >
      <Table.ScrollArea height="100%">
        <Table.Root
          size="sm"
          variant="line"
          css={{ tableLayout: "fixed", width: "100%" }}
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                position="sticky"
                top="0"
                zIndex={1}
                bg="bg.muted"
                fontSize="10px"
                textTransform="uppercase"
                color="fg.muted"
                width="38%"
                py="1.5"
              >
                Nama
              </Table.ColumnHeader>
              <Table.ColumnHeader
                position="sticky"
                top="0"
                zIndex={1}
                bg="bg.muted"
                fontSize="10px"
                textTransform="uppercase"
                color="fg.muted"
                py="1.5"
              >
                Info
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => {
              const isSelected = !!selectedKeys?.has(row.key);
              return (
                <Table.Row
                  key={row.key}
                  cursor="pointer"
                  bg={isSelected ? "blue.subtle" : undefined}
                  _hover={{ bg: isSelected ? "blue.subtle" : "bg.muted" }}
                  onClick={() => onSelect(row)}
                >
                  <Table.Cell
                    fontSize="11px"
                    fontWeight="medium"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    py="1"
                  >
                    {row.name}
                  </Table.Cell>
                  <Table.Cell
                    fontSize="11px"
                    color="fg.muted"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    py="1"
                  >
                    {row.info}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
});
