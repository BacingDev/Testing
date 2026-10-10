import { ButtonNode, buttonDefinition } from "@/features/app-renderer/Button";
import { CardNode, cardDefinition } from "@/features/app-renderer/Card";
import { ContainerNode, containerDefinition } from "@/features/app-renderer/Container";
import { DividerNode, dividerDefinition } from "@/features/app-renderer/Divider";
import { FormNode, formDefinition } from "@/features/app-renderer/Form";
import { HeadingNode, headingDefinition } from "@/features/app-renderer/Heading";
import { ImageNode, imageDefinition } from "@/features/app-renderer/Image";
import { InputNode, inputDefinition } from "@/features/app-renderer/Input";
import { ListNode, listDefinition } from "@/features/app-renderer/List";
import { NavbarNode, navbarDefinition } from "@/features/app-renderer/Navbar";
import { SpacerNode, spacerDefinition } from "@/features/app-renderer/Spacer";
import { TextNode, textDefinition } from "@/features/app-renderer/Text";
import { VideoNode, videoDefinition } from "@/features/app-renderer/Video";

export const registry = {
  Text: { component: TextNode, ...textDefinition },
  Heading: { component: HeadingNode, ...headingDefinition },
  Button: { component: ButtonNode, ...buttonDefinition },
  Image: { component: ImageNode, ...imageDefinition },
  Input: { component: InputNode, ...inputDefinition },
  Form: { component: FormNode, ...formDefinition },
  Container: { component: ContainerNode, ...containerDefinition },
  Divider: { component: DividerNode, ...dividerDefinition },
  List: { component: ListNode, ...listDefinition },
  Navbar: { component: NavbarNode, ...navbarDefinition },
  Spacer: { component: SpacerNode, ...spacerDefinition },
  Card: { component: CardNode, ...cardDefinition },
  Video: { component: VideoNode, ...videoDefinition },
};

export const componentTypes = Object.keys(registry);
