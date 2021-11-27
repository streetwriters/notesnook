import tap from "tap";
import { Enex } from "../index";

tap.test("enex file without an en-export element should throw", async () => {
  const invalidEnex = "<h1></h1>";
  tap.throws(
    () => new Enex(invalidEnex),
    /Invalid enex file. Must contain en-export element./g
  );
});

tap.test(
  "enex file without application attribute in en-export element should throw",
  async () => {
    const invalidEnex = `<en-export export-date="20070120T174209Z" version="10.12.3">
  <note></note>
  </en-export>`;
    tap.throws(
      () => new Enex(invalidEnex),
      /Invalid enex. application attribute is required./g
    );
  }
);

tap.test(
  "enex file without version attribute in en-export element should throw",
  async () => {
    const invalidEnex = `<en-export export-date="20070120T174209Z" application="evernote">
  <note></note>
  </en-export>`;
    tap.throws(
      () => new Enex(invalidEnex),
      /Invalid enex. version attribute is required./g
    );
  }
);

tap.test(
  "enex file without export-date attribute in en-export element should throw",
  async () => {
    const invalidEnex = `<en-export application="evernote" version="10.12.3">
  <note></note>
  </en-export>`;
    tap.throws(
      () => new Enex(invalidEnex),
      /Invalid enex. export-date attribute is required./g
    );
  }
);

tap.test("enex file with an invalid export-date should throw", async () => {
  const invalidEnex = `<en-export export-date="helloworld" application="evernote" version="10.12.3">
    <note></note>
    </en-export>`;
  tap.throws(
    () => new Enex(invalidEnex),
    /export-date value is not a valid date./g
  );
});

tap.test("enex file without note elements element should throw", async () => {
  const invalidEnex = `<en-export export-date="20070120T174209Z" application="evernote" version="10.12.3">
  </en-export>`;
  tap.throws(
    () => new Enex(invalidEnex),
    /Invalid enex. Enex file contains 0 notes./g
  );
});
