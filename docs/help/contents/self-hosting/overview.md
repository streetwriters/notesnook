# Overview

In addition to being 100% open source, Notesnook offers a complete setup for self hosting. This version is provided as-is without any kind of guarantees or dedicated support. We'll do our best to keep self hosting functional but if you face any issues specific to your hosting setup, you are on your own.

Self hosting is a niche art and it is expected that you have all the basic sysadmin knowledge required to run & secure your server. This guide will try to provide solutions for most common scenarios and setups but anything more complex is out of scope.

If you already have an account on Notesnook SaaS and want to switch to a self hosted setup, check out the following guide.

## Infrastructure

The self hosted setup consists of 5 services and 1 database:

1. `notesnook-db`: MonogDB for storing your data
2. `notesnook-s3`: Minio for storing your attachments
3. `identity-server`: For auth & login
4. `sync-server`: For syncing your notes
5. `sse-server`: For sending events & notifications to the client apps.
6. `monograph-server`: For serving published monographs

## Differences between self-hosted and SaaS

The following things are not included in the self-hosted setup:

1. Billing & subscriptions system
2. Issues & feedback system
3. Desktop, mobile & web clients
4. User administration sytem

Everything else is exactly the same.

## Intended audience

This guide is targeted towards people who want to self host Notesnook for personal use. While you can create multiple accounts on your self-hosted instance, we provide no support or guarantees on if/how it'll work.

## FAQs

### Do I need to purchase a subscription in order to self-host?

No. Self-hosting is completely independent and does not require any kind of connection or authentication with the official Notesnook instance.

### Will Notesnook (the company) know I am self-hosting?

No. There is no telemetry on either the server or the clients that'd let us know whether someone is self-hosting or not.

### Do I need to use the official apps if I am self-hosting?

No. You can compile all the apps from source and run them that way if you like.

### Can I get help from you if I face any issue during self-hosting?

No. This guide is provided with the assumption that _it works_. Any edge cases or specific setups are not handled or expected.
