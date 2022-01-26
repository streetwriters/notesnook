import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/theme-provider";
import "./App.css";
import { ThemeFactory } from "./theme";
import { Hero } from "./components/Hero";
import { LoginToNotesnook } from "./components/Step1";
import { GetAccountSalt } from "./components/Step2";
import { EnterAccountPassword } from "./components/Step3";
import { PasteEncryptedData } from "./components/Step4";
import { StepSeperator } from "./components/StepSeperator";
import { Footer } from "./components/Footer";

function App() {
  return (
    <ThemeProvider theme={ThemeFactory.construct()}>
      <Flex sx={{ flexDirection: "column" }}>
        <Hero />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <LoginToNotesnook />
          <StepSeperator />
          <GetAccountSalt />
          <StepSeperator />
          <EnterAccountPassword />
          <StepSeperator />
          <PasteEncryptedData />
        </Flex>
        <Footer />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
