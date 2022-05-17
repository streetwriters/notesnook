import { Flex, Select, Text } from "@theme-ui/components";
import { IProvider, ProviderFactory } from "@notesnook/importer";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepContainer } from "./StepContainer";

type ProviderSelectorProps = {
  onProviderChanged: (provider: IProvider) => void;
};

export function ProviderSelector(props: ProviderSelectorProps) {
  return (
    <StepContainer sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          justifyContent: ["stretch", "space-between"],
          flexDirection: ["column", "row"],
        }}
      >
        <Text variant="title">Select a notes app to import from</Text>
        <Select
          sx={{
            m: 0,
            px: 2,
            border: "1px solid var(--theme-ui-colors-border)",
            outline: "none",
            ":hover": {
              borderColor: "hover",
            },
            ":active": {
              borderColor: "active",
            },
            fontFamily: "body",
            fontSize: "body",
            width: ["100%", 150],
            mt: [2, 0],
            p: [2, 0],
            alignItems: "center",
            justifyContent: "center",
          }}
          onChange={(e) => {
            const providerName: Providers = e.target.value as Providers;
            props.onProviderChanged(ProviderFactory.getProvider(providerName));
          }}
        >
          <option value=""></option>
          {ProviderFactory.getAvailableProviders().map((provider) => (
            <option key={provider} value={provider}>
              {ProviderFactory.getProvider(provider as Providers).name}
            </option>
          ))}
        </Select>
      </Flex>
      <Text variant="body" sx={{ color: "fontTertiary", mt: [2, 0] }}>
        Can't find your notes app in the list?{" "}
        <a href="https://github.com/streetwriters/notesnook/issues/new">
          Send us a request.
        </a>
      </Text>
    </StepContainer>
  );
}
