const template = `<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
    <meta
      name="description"
      content="{{headline}}"
    />
    <title>{{title}} - Notesnook</title> 
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
