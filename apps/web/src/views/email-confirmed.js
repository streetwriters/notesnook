import "../app.css";
import { useEffect } from "react";
import { Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import { useQueryParams } from "../navigation";
import * as Icon from "../components/icons";

function EmailConfirmed() {
  const [{ userId }] = useQueryParams();
  useEffect(() => {
    if (!userId) window.location.href = "/";
  }, [userId]);

  return (
    <ThemeProvider>
      <Flex
        bg="background"
        height={"100%"}
        overflowY="auto"
        flexDirection={"column"}
        fontSize={[14, 16, 18]}
      >
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          flex={1}
        >
          <Icon.MailCheck
            sx={{ bg: "shade", borderRadius: 100, p: 5 }}
            size={72}
            color="primary"
          />
          <Text
            textAlign="center"
            variant="heading"
            fontWeight="heading"
            fontSize="2.5em"
            mt={5}
          >
            Huzzah!
          </Text>
          <Text
            textAlign="center"
            variant="heading"
            fontWeight="bold"
            fontSize="1.5em"
            color="icon"
            mt={2}
          >
            Your email has been confirmed.
          </Text>
          <Text
            textAlign="center"
            variant="body"
            fontSize="1.2em"
            color="fontTertiary"
            mt={2}
            sx={{ wordWrap: "break-word" }}
          >
            Thank you for choosing end-to-end encrypted note taking.
          </Text>
        </Flex>
        <Flex
          flexDirection="column"
          bg="bgSecondary"
          justifyContent="center"
          p={5}
        >
          <BlogPromoBanner link="https://blog.notesnook.com/why-another-note-taking-app/" />
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;

const social = [
  {
    title: "Discord",
    hoverColor: "#7289da",
    icon: Icon.Discord,
    link: "https://discord.com/invite/zQBK97EE22"
  },
  {
    title: "Twitter",
    hoverColor: "#1da1f2",
    icon: Icon.Twitter,
    link: "https://twitter.com/notesnook"
  },
  {
    title: "Reddit",
    hoverColor: "#ff4500",
    icon: Icon.Reddit,
    link: "https://reddit.com/r/Notesnook"
  }
];
function BlogPromoBanner(props) {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Text variant="heading" fontSize="1.2em" textAlign="center">
        Share Notesnook with your friends!
      </Text>
      <Text
        textAlign="center"
        variant="body"
        fontSize="1em"
        color="fontTertiary"
        mt={2}
        sx={{ wordWrap: "break-word" }}
      >
        Because where's the fun in nookin' alone?
      </Text>
      <Flex mt={5}>
        {social.map((account) => (
          <account.icon
            hoverColor={account.hoverColor}
            title={account.title}
            onClick={() => {
              window.open(account.link, "_blank");
              trackEvent(ANALYTICS_EVENTS.socialLink, account.title);
            }}
            size={30}
            sx={{ mr: 1, cursor: "pointer" }}
          />
        ))}
      </Flex>
      <Text
        textAlign="center"
        variant="body"
        color="fontTertiary"
        mt={2}
        sx={{ wordWrap: "break-word" }}
      >
        Use{" "}
        <Text as="span" fontWeight="bold" color="primary">
          #notesnook
        </Text>{" "}
        and get a chance to win free promo codes.
      </Text>
      {/* <p>
        Listen. We want you to buy Notesnook Pro. It's as simple as that. Since
        2019, we have been analyzing the ever increasing trend towards privacy
        invasive apps.
      </p>
      <p>
        Notion. Evernote. Google Keep. Trello. People flock to these apps to
        solve their "problems". What they never realize is that Trello is packed
        with 100+ trackers. What they don't realize is that Google is using
        their "smart" notes to sell them ads. There is no end to this.
      </p>
      <p>
        The result is clear. No one cares about privacy. Security &amp;
        encryption are just buzzwords.
      </p>
      <p>
        We want you to buy Notesnook Pro. Not to line our own pockets but to
        bring a change. Instead of. We want to hear that phrase. "I bought
        Notesnook instead of Evernote". For us, that is success.
      </p>
      <p>
        There are no two ways about it. The world is moving towards a time when
        privacy, security, freedom will be just words...memories. Call me a
        conspiracy theorist but the evidence makes this clear. The world where
        Big Data will govern us is not far.
      </p>
      <p>
        99% of the people will shrug and move on. That's okay. But you can
        choose not to. You can choose freedom, privacy, and security. I promise
        it won't hurt.
      </p> */}
      {/* <Button
        mt={2}
        as="a"
        href={link}
        target="_blank"
        fontSize="title"
        width="100%"
        fontWeight="bold"
        sx={{ boxShadow: "2px 2px 15px 0px #00000044" }}
        onClick={() =>
          trackEvent(`Email verification blog promo`, "blog-promo")
        }
      >
        How are we going to do that? Read on.
      </Button> */}
    </Flex>
  );
}

// function SaleBanner(props) {
//   const { discount, coupon, userId } = props;

//   return (
//     <Flex flexDirection="column" p={4}>
//       <Text
//         as="p"
//         variant="body"
//         fontSize="title"
//         lineHeight="22px"
//         textAlign="center"
//       >
//         We started out building Notesnook in November 2019. Our mission was to
//         make privacy simple. It is one thing to say,{" "}
//         <Text as="span" color="primary">
//           "Privacy is our basic right"
//         </Text>{" "}
//         and quite another to actually prove it.
//         <br />
//         Almost 1 and a half year later, we are here with over 2000 users, 5000+
//         downloads on Google Play Store, 10,000+ encrypted notes, and 100+
//         members in our Discord community; all proof that{" "}
//         <Text as="span" color="primary">
//           privacy matters.
//         </Text>
//         <br />
//       </Text>
//       <Text variant="title" mt={2} textAlign="center">
//         In celebration of this happy day, we are giving a special discount to
//         all our new members.
//       </Text>
//       <Text
//         variant="heading"
//         fontSize={32}
//         color="primary"
//         textAlign="center"
//         fontWeight="bold"
//         mt={2}
//       >
//         {discount}% OFF if you subscribe today!
//       </Text>
//       <Button
//         mt={2}
//         fontSize="title"
//         width="100%"
//         fontWeight="bold"
//         sx={{ boxShadow: "2px 2px 15px 0px #00000044" }}
//         onClick={async () => {
//           trackEvent(`Email verification offer`, "offers");
//           let user = await db.user.getUser();
//           if (user && user.id !== userId) await db.user.logout(true);
//           await showBuyDialog(coupon);
//         }}
//       >
//         Subscribe now and stand up for privacy!
//       </Button>
//       <Text variant="body" textAlign="center" mt={2} color="fontTertiary">
//         Big companies say, "X feature won't be possible if we went
//         zero-knowledge." We are here to call them out. Your contribution will
//         help us prove that giving up on privacy is just an excuse to rip users
//         off, sell their data and make money.
//         <Text variant="body" fontSize="subBody" mt={1}>
//           *Use code <b>{coupon}</b> at checkout to get your discount.
//         </Text>
//         <Text variant="body" fontSize="subBody" mt={1}>
//           ** Only the first 10 people get to claim the discount. Be the first.
//         </Text>
//       </Text>
//     </Flex>
//   );
// }
