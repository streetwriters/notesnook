const template = `<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
    <meta
      name="description"
      content="Notesnook is the most secure, zero-knowledge based, encrypted note-taking app all compiled into one simple to use package that works on all major platforms."
    />
    <title>{{title}} - Notesnook</title>
    <!-- DO NOT TOUCH THESE TAGS -->
    {{metaTags}}
  </head>
  <body>
    <h1>{{title}}</h1>
    {{content}}
    <br/>
    Created on: <b>{{createdOn}}</b><br/>
    Edited on: <b>{{editedOn}}</b>
  </body>
</html>
`;
export default template;
