import { ButtonNode, buttonDefinition } from "@/features/app-renderer/Button";
import { CardNode, cardDefinition } from "@/features/app-renderer/Card";
import { ContainerNode, containerDefinition } from "@/features/app-renderer/Container";
import { FormNode, formDefinition } from "@/features/app-renderer/Form";
import { HeadingNode, headingDefinition } from "@/features/app-renderer/Heading";
import { ImageNode, imageDefinition } from "@/features/app-renderer/Image";
import { InputNode, inputDefinition } from "@/features/app-renderer/Input";
import { ListNode, listDefinition } from "@/features/app-renderer/List";
import { TextNode, textDefinition } from "@/features/app-renderer/Text";

export const registry = {
  Text: { component: TextNode, ...textDefinition },
  Heading: { component: HeadingNode, ...headingDefinition },
  Button: { component: ButtonNode, ...buttonDefinition },
  Image: { component: ImageNode, ...imageDefinition },
  Input: { component: InputNode, ...inputDefinition },
  Form: { component: FormNode, ...formDefinition },
  Container: { component: ContainerNode, ...containerDefinition },
  List: { component: ListNode, ...listDefinition },
  Card: { component: CardNode, ...cardDefinition },
};

export const componentTypes = Object.keys(registry);
