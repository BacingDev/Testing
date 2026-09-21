import { Box, Flex } from "@chakra-ui/react";
import FlowEditor from "@/components/flow-editor";
import Navbar from "@/components/layout/navbar";
import ContextMenu from "@/components/layout/context-menu";
import LeftSidebar from "@/components/layout/left-sidebar";
import RightSidebar from "@/components/layout/right-sidebar";

export default function Home() {
  return (
    <Flex direction="column" height="100vh" overflow="hidden" bg="bg.subtle">
      <Navbar />
      <ContextMenu />
      <Flex minHeight="0" flex="1" overflow="hidden">
        <LeftSidebar />
        <Box as="main" flex="1" minWidth="0" overflow="hidden">
          <FlowEditor />
        </Box>
        <RightSidebar />
      </Flex>
    </Flex>
  );
}
