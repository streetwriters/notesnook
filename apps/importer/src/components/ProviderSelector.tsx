import { Flex, Select, Text } from "@theme-ui/components";
import { ProviderFactory } from "@notesnook/importer";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepContainer } from "./StepContainer";

type ProviderSelectorProps = {
  onProviderChanged: (provider: Providers) => void;
};

export function ProviderSelector(props: ProviderSelectorProps) {
  return (
    <StepContainer sx={{ flexDirection: "column" }}>
      <Flex sx={{ justifyContent: "space-between" }}>
        <Text variant="title">Choose a provider to import from</Text>
        <Select
          sx={{
            p: 0,
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
            width: 150,
          }}
          onChange={(e) => {
            const providerName: Providers = e.target.value as Providers;
            props.onProviderChanged(providerName);
          }}
        >
          <option value=""></option>
          {ProviderFactory.getAvailableProviders().map((provider) => (
            <option value={provider}>
              {ProviderFactory.getProvider(provider as Providers).name}
            </option>
          ))}
        </Select>
      </Flex>
      <Text variant="body" sx={{ color: "fontTertiary" }}>
        Can't find your notes app in the list?{" "}
        <a href="https://github.com/streetwriters/notesnook/issues/new">
          Send us a request.
        </a>
      </Text>
    </StepContainer>
  );
}
