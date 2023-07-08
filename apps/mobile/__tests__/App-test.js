/**
 * @format
 */

import "react-native";
import { it } from "@jest/globals";
// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";
import Heading from "../app/components/ui/typography/heading";
import Paragraph from "../app/components/ui/typography/paragraph";

it("Heading renders correctly", (done) => {
  let instance = renderer.create(<Heading>Heading</Heading>);
  expect(instance.root.props.children).toBe("Heading");
  done();
});

it("Paragraph renders correctly", (done) => {
  let instance = renderer.create(<Paragraph>Paragraph</Paragraph>);
  expect(instance.root.props.children).toBe("Paragraph");
  done();
});
