How at rest encryption works:

There are 3 keys:

1. App lock pin/password (if app lock is enabled) - set by user
2. Database encryption key (local) - randomly generated
3. User encryption key (global) - generated from user's password

If app lock is not set, the flow looks like this:

Database encryption key
-> User encryption key
-> Database

If the user enables app lock, the flow becomes:

App lock pin/password
-> Database encryption key
---> User encryption key
---> Database

Where each level of depth indicates parent-child relation.

Storing credentials:

The app lock pin/password must not be stored anywhere. This is akin to a "master password" and should be the responsibility of the user to keep safe.

The database encryption key & the user encryption key are always stored in the `keystore`. Once the user unlocks the app lock, the decrypted database encryption key is kept in memory. This is done to make the process of further encryption/decryption simpler.

The flow will be as follows:

1. Open app
2. Find out if app lock is enabled
3. If enabled, show the app lock and wait for the user to enter the pin
4. Take the pin and decrypt the machine generated database password + user's actual encryption key (we will store both together)
5. Use the database password to init the db & keep the user's encryption key in memory. (we have 2 choices here: either keep the encryption key in memory or keep the pin in memory)
6. If not enabled, we will ask the keystore to give us the database password + user's encryption key

We should store both the database password and the user's encryption key in a keychain. If user sets a pin, we can just double encrypt these values. This will keep things simple and seamless.

Q: How to find out if app lock is enabled?

One option is to just store a boolean in the localStorage.

Q: What would be the initial state of things?

Initially, when user logs in there will be no app lock so we will be doing step 6. If a user sets up an app lock, we will do step 3 to 5.

Q: Changing app lock pin

Changing the app lock pin will ask for both current pin and older pin for conventional reasons. We will verify the current pin similar to how we verified it before (by decrypting the values stored in the keychain) and then we will reencrypt these values using the new pin.

Q: Disabling app lock

Disabling app lock will ask for the current pin. This pin will be used to remove encryption from the values stored in the keychain.

Q: Logged out users

For logged out users, we will simply use default at rest encryption.

Q: App lock levels

1. None
2. Medium - app is locked only on close
3. High - app is locked on tab switch & app close

Some users have requested app lock timeout which basically locks the app after a certain period of inactivity. What is inactivity? Mouse movement? Key presses? This can be added on all levels, I think?
