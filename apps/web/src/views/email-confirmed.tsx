/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import "../app.css";
import { useEffect } from "react";
import { Flex, Text } from "@theme-ui/components";
import { useQueryParams } from "../navigation";
import { MailCheck, Discord, Twitter, Reddit } from "../components/icons";
import { strings } from "@notesnook/intl";

function EmailConfirmed() {
  const [{ userId }] = useQueryParams();
  useEffect(() => {
    if (!userId) window.location.href = "/";
  }, [userId]);

  return (
    <Flex
      sx={{
        bg: "background",
        flexDirection: "column",
        fontSize: [14, 16, 18],
        height: "100%",
        overflowY: "auto"
      }}
    >
      <Flex
        sx={{
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <MailCheck
          sx={{ bg: "shade", borderRadius: 100, p: 5 }}
          size={72}
          color="accent"
        />
        <Text
          variant="heading"
          mt={5}
          sx={{
            fontSize: "2.5em",
            textAlign: "center",
            fontWeight: "heading"
          }}
        >
          Huzzah!
        </Text>
        <Text
          variant="heading"
          mt={2}
          sx={{
            fontSize: "1.5em",
            textAlign: "center",
            fontWeight: "bold",
            color: "icon"
          }}
        >
          {strings.emailConfirmed()}
        </Text>
        <Text
          variant="body"
          mt={2}
          sx={{
            wordWrap: "break-word",
            fontSize: "1.2em",
            textAlign: "center",
            color: "var(--paragraph-secondary)"
          }}
        >
          {strings.confirmEmailThankyou()}
        </Text>
      </Flex>
      <Flex
        bg="var(--background-secondary)"
        p={5}
        sx={{ flexDirection: "column", justifyContent: "center" }}
      >
        <BlogPromoBanner />
      </Flex>
    </Flex>
  );
}
export default EmailConfirmed;

const social = [
  {
    title: "Discord",
    hoverColor: "#7289da",
    icon: Discord,
    link: "https://discord.com/invite/zQBK97EE22"
  },
  {
    title: "Twitter",
    hoverColor: "#1da1f2",
    icon: Twitter,
    link: "https://twitter.com/notesnook"
  },
  {
    title: "Reddit",
    hoverColor: "#ff4500",
    icon: Reddit,
    link: "https://reddit.com/r/Notesnook"
  }
];
function BlogPromoBanner() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text variant="heading" sx={{ fontSize: "1.2em", textAlign: "center" }}>
        {strings.shareWithFriends()}
      </Text>
      <Text
        variant="body"
        mt={2}
        sx={{
          wordWrap: "break-word",
          fontSize: "1em",
          textAlign: "center",
          color: "paragraph"
        }}
      >
        {strings.shareWithFriendsDesc()}
      </Text>
      <Flex mt={5}>
        {social.map((account) => (
          <account.icon
            key={account.title}
            title={account.title}
            onClick={() => {
              window.open(account.link, "_blank");
            }}
            size={30}
            sx={{ mr: 1, cursor: "pointer" }}
          />
        ))}
      </Flex>
      <Text
        variant="body"
        mt={2}
        sx={{
          wordWrap: "break-word",
          textAlign: "center",
          color: "paragraph"
        }}
      >
        {strings.tagPromoWinText()[0]}{" "}
        <Text as="span" sx={{ fontWeight: "bold", color: "accent" }}>
          {strings.tagPromoWinText()[1]}
        </Text>{" "}
        {strings.tagPromoWinText()[2]}
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
        
        
        
        sx={{ boxShadow: "2px 2px 15px 0px #00000044" ,fontSize: "title", fontWeight: "bold", width: "100%"}}
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
//     <Flex  p={4} sx={{flexDirection: "column"}}>
//       <Text
//         as="p"
//         variant="body"
//
//         lineHeight="22px"
//
//        sx={{fontSize: "title", textAlign: "center"}}>
//         We started out building Notesnook in November 2019. Our mission was to
//         make privacy simple. It is one thing to say,{" "}
//         <Text as="span"  sx={{color: "primary"}}>
//           "Privacy is our basic right"
//         </Text>{" "}
//         and quite another to actually prove it.
//         <br />
//         Almost 1 and a half year later, we are here with over 2000 users, 5000+
//         downloads on Google Play Store, 10,000+ encrypted notes, and 100+
//         members in our Discord community; all proof that{" "}
//         <Text as="span"  sx={{color: "primary"}}>
//           privacy matters.
//         </Text>
//         <br />
//       </Text>
//       <Text variant="title" mt={2}  sx={{textAlign: "center"}}>
//         In celebration of this happy day, we are giving a special discount to
//         all our new members.
//       </Text>
//       <Text
//         variant="heading"
//
//
//
//
//         mt={2}
//        sx={{fontSize: 32, textAlign: "center", fontWeight: "bold", color: "primary"}}>
//         {discount}% OFF if you subscribe today!
//       </Text>
//       <Button
//         mt={2}
//
//
//
//         sx={{ boxShadow: "2px 2px 15px 0px #00000044" ,fontSize: "title", fontWeight: "bold", width: "100%"}}
//         onClick={async () => {
//           trackEvent(`Email verification offer`, "offers");
//           let user = await db.user.getUser();
//           if (user && user.id !== userId) await db.user.logout(true);
//           await showBuyDialog(coupon);
//         }}
//       >
//         Subscribe now and stand up for privacy!
//       </Button>
//       <Text variant="body"  mt={2}  sx={{textAlign: "center", color: "fontTertiary"}}>
//         Big companies say, "X feature won't be possible if we went
//         zero-knowledge." We are here to call them out. Your contribution will
//         help us prove that giving up on privacy is just an excuse to rip users
//         off, sell their data and make money.
//         <Text variant="body"  mt={1} sx={{fontSize: "subBody"}}>
//           *Use code <b>{coupon}</b> at checkout to get your discount.
//         </Text>
//         <Text variant="body"  mt={1} sx={{fontSize: "subBody"}}>
//           ** Only the first 10 people get to claim the discount. Be the first.
//         </Text>
//       </Text>
//     </Flex>
//   );
// }
