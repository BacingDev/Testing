import { Flex } from "@chakra-ui/react";
import PropertiesPanel from "@/components/properties/properties-panel";

export default function RightSidebar() {
  return (
    <Flex
      as="aside"
      direction="column"
      width="96"
      flexShrink="0"
      minHeight="0"
      overflow="hidden"
      borderLeftWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <PropertiesPanel />
    </Flex>
  );
}
