/**
 * Modified the link plugin to not open a full screen dialog.
 * Instead we open the small link insertion toolbar.
 */

/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.6.2 (2020-12-08)
 */

(function () {
  var global = tinymce.util.Tools.resolve("tinymce.PluginManager");

  var global$1 = tinymce.util.Tools.resolve("tinymce.util.VK");

  var typeOf = function (x) {
    var t = typeof x;
    if (x === null) {
      return "null";
      // eslint-disable-next-line no-mixed-operators
    } else if (
      t === "object" &&
      (Array.prototype.isPrototypeOf(x) ||
        (x.constructor && x.constructor.name === "Array"))
    ) {
      return "array";
      // eslint-disable-next-line no-mixed-operators
    } else if (
      t === "object" &&
      (String.prototype.isPrototypeOf(x) ||
        (x.constructor && x.constructor.name === "String"))
    ) {
      return "string";
    } else {
      return t;
    }
  };
  var isType = function (type) {
    return function (value) {
      return typeOf(value) === type;
    };
  };
  var isSimpleType = function (type) {
    return function (value) {
      return typeof value === type;
    };
  };
  var eq = function (t) {
    return function (a) {
      return t === a;
    };
  };
  var isString = isType("string");
  var isNull = eq(null);
  var isBoolean = isSimpleType("boolean");

  var assumeExternalTargets = function (editor) {
    var externalTargets = editor.getParam(
      "link_assume_external_targets",
      false
    );
    if (isBoolean(externalTargets) && externalTargets) {
      return 1;
    } else if (
      isString(externalTargets) &&
      (externalTargets === "http" || externalTargets === "https")
    ) {
      return externalTargets;
    }
    return 0;
  };
  var hasContextToolbar = function (editor) {
    return editor.getParam("link_context_toolbar", false, "boolean");
  };
  var getDefaultLinkTarget = function (editor) {
    return editor.getParam("default_link_target");
  };
  var allowUnsafeLinkTarget = function (editor) {
    return editor.getParam("allow_unsafe_link_target", false, "boolean");
  };

  var appendClickRemove = function (link, evt) {
    document.body.appendChild(link);
    link.dispatchEvent(evt);
    document.body.removeChild(link);
  };
  var open = function (url) {
    var link = document.createElement("a");
    link.target = "_blank";
    link.href = url;
    link.rel = "noreferrer noopener";
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(
      "click",
      true,
      true,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    appendClickRemove(link, evt);
  };

  var __assign = function () {
    __assign =
      Object.assign ||
      function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };

  var noop = function () {};
  var constant = function (value) {
    return function () {
      return value;
    };
  };
  var never = constant(false);
  var always = constant(true);

  var none = function () {
    return NONE;
  };
  var NONE = (function () {
    var eq = function (o) {
      return o.isNone();
    };
    var call = function (thunk) {
      return thunk();
    };
    var id = function (n) {
      return n;
    };
    var me = {
      fold: function (n, _s) {
        return n();
      },
      is: never,
      isSome: never,
      isNone: always,
      getOr: id,
      getOrThunk: call,
      getOrDie: function (msg) {
        throw new Error(msg || "error: getOrDie called on none.");
      },
      getOrNull: constant(null),
      getOrUndefined: constant(undefined),
      or: id,
      orThunk: call,
      map: none,
      each: noop,
      bind: none,
      exists: never,
      forall: always,
      filter: none,
      equals: eq,
      equals_: eq,
      toArray: function () {
        return [];
      },
      toString: constant("none()"),
    };
    return me;
  })();
  var some = function (a) {
    var constant_a = constant(a);
    var self = function () {
      return me;
    };
    var bind = function (f) {
      return f(a);
    };
    var me = {
      fold: function (n, s) {
        return s(a);
      },
      is: function (v) {
        return a === v;
      },
      isSome: always,
      isNone: never,
      getOr: constant_a,
      getOrThunk: constant_a,
      getOrDie: constant_a,
      getOrNull: constant_a,
      getOrUndefined: constant_a,
      or: self,
      orThunk: self,
      map: function (f) {
        return some(f(a));
      },
      each: function (f) {
        f(a);
      },
      bind: bind,
      exists: bind,
      forall: bind,
      filter: function (f) {
        return f(a) ? me : NONE;
      },
      toArray: function () {
        return [a];
      },
      toString: function () {
        return "some(" + a + ")";
      },
      equals: function (o) {
        return o.is(a);
      },
      equals_: function (o, elementEq) {
        return o.fold(never, function (b) {
          return elementEq(a, b);
        });
      },
    };
    return me;
  };
  var from = function (value) {
    return value === null || value === undefined ? NONE : some(value);
  };
  var Optional = {
    some: some,
    none: none,
    from: from,
  };

  var each = function (xs, f) {
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      f(x, i);
    }
  };
  var foldl = function (xs, f, acc) {
    each(xs, function (x) {
      acc = f(acc, x);
    });
    return acc;
  };

  var keys = Object.keys;
  var hasOwnProperty = Object.hasOwnProperty;
  var each$1 = function (obj, f) {
    var props = keys(obj);
    for (var k = 0, len = props.length; k < len; k++) {
      var i = props[k];
      var x = obj[i];
      f(x, i);
    }
  };
  var objAcc = function (r) {
    return function (x, i) {
      r[i] = x;
    };
  };
  var internalFilter = function (obj, pred, onTrue, onFalse) {
    var r = {};
    each$1(obj, function (x, i) {
      (pred(x, i) ? onTrue : onFalse)(x, i);
    });
    return r;
  };
  var filter = function (obj, pred) {
    var t = {};
    internalFilter(obj, pred, objAcc(t), noop);
    return t;
  };
  var has = function (obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  var global$2 = tinymce.util.Tools.resolve("tinymce.dom.TreeWalker");

  var global$3 = tinymce.util.Tools.resolve("tinymce.util.Tools");

  var isAnchor = function (elm) {
    return elm && elm.nodeName.toLowerCase() === "a";
  };
  var isLink = function (elm) {
    return isAnchor(elm) && !!getHref(elm);
  };
  var collectNodesInRange = function (rng, predicate) {
    if (rng.collapsed) {
      return [];
    } else {
      var contents = rng.cloneContents();
      var walker = new global$2(contents.firstChild, contents);
      var elements = [];
      var current = contents.firstChild;
      do {
        if (predicate(current)) {
          elements.push(current);
        }
        // eslint-disable-next-line no-cond-assign
      } while ((current = walker.next()));
      return elements;
    }
  };
  var hasProtocol = function (url) {
    return /^\w+:/i.test(url);
  };
  var getHref = function (elm) {
    var href = elm.getAttribute("data-mce-href");
    return href ? href : elm.getAttribute("href");
  };
  var applyRelTargetRules = function (rel, isUnsafe) {
    var rules = ["noopener"];
    var rels = rel ? rel.split(/\s+/) : [];
    var toString = function (rels) {
      return global$3.trim(rels.sort().join(" "));
    };
    var addTargetRules = function (rels) {
      rels = removeTargetRules(rels);
      return rels.length > 0 ? rels.concat(rules) : rules;
    };
    var removeTargetRules = function (rels) {
      return rels.filter(function (val) {
        return global$3.inArray(rules, val) === -1;
      });
    };
    var newRels = isUnsafe ? addTargetRules(rels) : removeTargetRules(rels);
    return newRels.length > 0 ? toString(newRels) : "";
  };
  var trimCaretContainers = function (text) {
    return text.replace(/\uFEFF/g, "");
  };
  var getAnchorElement = function (editor, selectedElm) {
    selectedElm = selectedElm || editor.selection.getNode();
    if (isImageFigure(selectedElm)) {
      return editor.dom.select("a[href]", selectedElm)[0];
    } else {
      return editor.dom.getParent(selectedElm, "a[href]");
    }
  };
  var getAnchorText = function (selection, anchorElm) {
    var text = anchorElm
      ? anchorElm.innerText || anchorElm.textContent
      : selection.getContent({ format: "text" });
    return trimCaretContainers(text);
  };
  var hasLinks = function (elements) {
    return global$3.grep(elements, isLink).length > 0;
  };
  var hasLinksInSelection = function (rng) {
    return collectNodesInRange(rng, isLink).length > 0;
  };
  var isOnlyTextSelected = function (editor) {
    var inlineTextElements = editor.schema.getTextInlineElements();
    var isElement = function (elm) {
      return (
        elm.nodeType === 1 &&
        !isAnchor(elm) &&
        !has(inlineTextElements, elm.nodeName.toLowerCase())
      );
    };
    var elements = collectNodesInRange(editor.selection.getRng(), isElement);
    return elements.length === 0;
  };
  var isImageFigure = function (elm) {
    return elm && elm.nodeName === "FIGURE" && /\bimage\b/i.test(elm.className);
  };
  var getLinkAttrs = function (data) {
    return foldl(
      ["title", "rel", "class", "target"],
      function (acc, key) {
        data[key].each(function (value) {
          acc[key] = value.length > 0 ? value : null;
        });
        return acc;
      },
      { href: data.href }
    );
  };
  var handleExternalTargets = function (href, assumeExternalTargets) {
    if (
      (assumeExternalTargets === "http" || assumeExternalTargets === "https") &&
      !hasProtocol(href)
    ) {
      return assumeExternalTargets + "://" + href;
    }
    return href;
  };
  var applyLinkOverrides = function (editor, linkAttrs) {
    var newLinkAttrs = __assign({}, linkAttrs);
    if (allowUnsafeLinkTarget(editor) === false) {
      var newRel = applyRelTargetRules(
        newLinkAttrs.rel,
        newLinkAttrs.target === "_blank"
      );
      newLinkAttrs.rel = newRel ? newRel : null;
    }
    if (Optional.from(newLinkAttrs.target).isNone()) {
      newLinkAttrs.target = getDefaultLinkTarget(editor);
    }
    newLinkAttrs.href = handleExternalTargets(
      newLinkAttrs.href,
      assumeExternalTargets(editor)
    );
    return newLinkAttrs;
  };
  var updateLink = function (editor, anchorElm, text, linkAttrs) {
    text.each(function (text) {
      if (anchorElm.hasOwnProperty("innerText")) {
        anchorElm.innerText = text;
      } else {
        anchorElm.textContent = text;
      }
    });
    editor.dom.setAttribs(anchorElm, linkAttrs);
    editor.selection.select(anchorElm);
  };
  var createLink = function (editor, selectedElm, text, linkAttrs) {
    if (isImageFigure(selectedElm)) {
      linkImageFigure(editor, selectedElm, linkAttrs);
    } else {
      text.fold(
        function () {
          editor.execCommand("mceInsertLink", false, linkAttrs);
        },
        function (text) {
          editor.insertContent(
            editor.dom.createHTML("a", linkAttrs, editor.dom.encode(text))
          );
        }
      );
    }
  };
  var linkDomMutation = function (editor, attachState, data) {
    var selectedElm = editor.selection.getNode();
    var anchorElm = getAnchorElement(editor, selectedElm);
    var linkAttrs = applyLinkOverrides(editor, getLinkAttrs(data));
    editor.undoManager.transact(function () {
      if (data.href === attachState.href) {
        attachState.attach();
      }
      if (anchorElm) {
        editor.focus();
        updateLink(editor, anchorElm, data.text, linkAttrs);
      } else {
        createLink(editor, selectedElm, data.text, linkAttrs);
      }
    });
  };
  var unlinkSelection = function (editor) {
    var dom = editor.dom,
      selection = editor.selection;
    var bookmark = selection.getBookmark();
    var rng = selection.getRng().cloneRange();
    var startAnchorElm = dom.getParent(
      rng.startContainer,
      "a[href]",
      editor.getBody()
    );
    var endAnchorElm = dom.getParent(
      rng.endContainer,
      "a[href]",
      editor.getBody()
    );
    if (startAnchorElm) {
      rng.setStartBefore(startAnchorElm);
    }
    if (endAnchorElm) {
      rng.setEndAfter(endAnchorElm);
    }
    selection.setRng(rng);
    editor.execCommand("unlink");
    selection.moveToBookmark(bookmark);
  };
  var unlinkDomMutation = function (editor) {
    editor.undoManager.transact(function () {
      var node = editor.selection.getNode();
      if (isImageFigure(node)) {
        unlinkImageFigure(editor, node);
      } else {
        unlinkSelection(editor);
      }
      editor.focus();
    });
  };
  var unwrapOptions = function (data) {
    var cls = data.class,
      href = data.href,
      rel = data.rel,
      target = data.target,
      text = data.text,
      title = data.title;
    return filter(
      {
        class: cls.getOrNull(),
        href: href,
        rel: rel.getOrNull(),
        target: target.getOrNull(),
        text: text.getOrNull(),
        title: title.getOrNull(),
      },
      function (v, _k) {
        return isNull(v) === false;
      }
    );
  };
  var link = function (editor, attachState, data) {
    editor.hasPlugin("rtc", true)
      ? editor.execCommand("createlink", false, unwrapOptions(data))
      : linkDomMutation(editor, attachState, data);
  };
  var unlink = function (editor) {
    editor.hasPlugin("rtc", true)
      ? editor.execCommand("unlink")
      : unlinkDomMutation(editor);
  };
  var unlinkImageFigure = function (editor, fig) {
    var img = editor.dom.select("img", fig)[0];
    if (img) {
      var a = editor.dom.getParents(img, "a[href]", fig)[0];
      if (a) {
        a.parentNode.insertBefore(img, a);
        editor.dom.remove(a);
      }
    }
  };
  var linkImageFigure = function (editor, fig, attrs) {
    var img = editor.dom.select("img", fig)[0];
    if (img) {
      var a = editor.dom.create("a", attrs);
      img.parentNode.insertBefore(a, img);
      a.appendChild(img);
    }
  };

  var getLink = function (editor, elm) {
    return editor.dom.getParent(elm, "a[href]");
  };
  var getSelectedLink = function (editor) {
    return getLink(editor, editor.selection.getStart());
  };
  var hasOnlyAltModifier = function (e) {
    return (
      e.altKey === true &&
      e.shiftKey === false &&
      e.ctrlKey === false &&
      e.metaKey === false
    );
  };
  var gotoLink = function (editor, a) {
    if (a) {
      var href = getHref(a);
      if (/^#/.test(href)) {
        var targetEl = editor.$(href);
        if (targetEl.length) {
          editor.selection.scrollIntoView(targetEl[0], true);
        }
      } else {
        open(a.href);
      }
    }
  };
  var openDialog = function (editor) {
    return function () {
      editor.fire("contexttoolbar-show", { toolbarKey: "quicklink" });
    };
  };
  var gotoSelectedLink = function (editor) {
    return function () {
      gotoLink(editor, getSelectedLink(editor));
    };
  };
  var setupGotoLinks = function (editor) {
    editor.on("click", function (e) {
      var link = getLink(editor, e.target);
      if (link && global$1.metaKeyPressed(e)) {
        e.preventDefault();
        gotoLink(editor, link);
      }
    });
    editor.on("keydown", function (e) {
      var link = getSelectedLink(editor);
      if (link && e.keyCode === 13 && hasOnlyAltModifier(e)) {
        e.preventDefault();
        gotoLink(editor, link);
      }
    });
  };
  var toggleState = function (editor, toggler) {
    editor.on("NodeChange", toggler);
    return function () {
      return editor.off("NodeChange", toggler);
    };
  };
  var toggleActiveState = function (editor) {
    return function (api) {
      return toggleState(editor, function () {
        api.setActive(
          !editor.mode.isReadOnly() &&
            getAnchorElement(editor, editor.selection.getNode()) !== null
        );
      });
    };
  };
  var toggleEnabledState = function (editor) {
    return function (api) {
      var updateState = function () {
        return api.setDisabled(
          getAnchorElement(editor, editor.selection.getNode()) === null
        );
      };
      updateState();
      return toggleState(editor, updateState);
    };
  };
  var toggleUnlinkState = function (editor) {
    return function (api) {
      var hasLinks$1 = function (parents) {
        return (
          hasLinks(parents) || hasLinksInSelection(editor.selection.getRng())
        );
      };
      var parents = editor.dom.getParents(editor.selection.getStart());
      api.setDisabled(!hasLinks$1(parents));
      return toggleState(editor, function (e) {
        return api.setDisabled(!hasLinks$1(e.parents));
      });
    };
  };

  var register = function (editor) {
    editor.addCommand("mceLink", function () {
      openDialog(editor)();
    });
  };

  var setup = function (editor) {
    editor.addShortcut("Meta+K", "", function () {
      editor.execCommand("mceLink");
    });
  };

  var setupButtons = function (editor) {
    editor.ui.registry.addToggleButton("link", {
      icon: "link",
      tooltip: "Insert/edit link",
      onAction: openDialog(editor),
      onSetup: toggleActiveState(editor),
    });
    editor.ui.registry.addButton("openlink", {
      icon: "new-tab",
      tooltip: "Open link",
      onAction: gotoSelectedLink(editor),
      onSetup: toggleEnabledState(editor),
    });
    editor.ui.registry.addButton("unlink", {
      icon: "unlink",
      tooltip: "Remove link",
      onAction: function () {
        return unlink(editor);
      },
      onSetup: toggleUnlinkState(editor),
    });
  };
  var setupMenuItems = function (editor) {
    editor.ui.registry.addMenuItem("openlink", {
      text: "Open link",
      icon: "new-tab",
      onAction: gotoSelectedLink(editor),
      onSetup: toggleEnabledState(editor),
    });
    editor.ui.registry.addMenuItem("link", {
      icon: "link",
      text: "Link...",
      shortcut: "Meta+K",
      onAction: openDialog(editor),
    });
    editor.ui.registry.addMenuItem("unlink", {
      icon: "unlink",
      text: "Remove link",
      onAction: function () {
        return unlink(editor);
      },
      onSetup: toggleUnlinkState(editor),
    });
  };
  var setupContextMenu = function (editor) {
    var inLink = "link unlink openlink";
    var noLink = "link";
    editor.ui.registry.addContextMenu("link", {
      update: function (element) {
        return hasLinks(editor.dom.getParents(element, "a")) ? inLink : noLink;
      },
    });
  };
  var setupContextToolbars = function (editor) {
    var collapseSelectionToEnd = function (editor) {
      editor.selection.collapse(false);
    };
    var onSetupLink = function (buttonApi) {
      var node = editor.selection.getNode();
      buttonApi.setDisabled(!getAnchorElement(editor, node));
      return noop;
    };
    editor.ui.registry.addContextForm("quicklink", {
      launch: {
        type: "contextformtogglebutton",
        icon: "link",
        tooltip: "Link",
        onSetup: toggleActiveState(editor),
      },
      label: "Link",
      predicate: function (node) {
        return !!getAnchorElement(editor, node) && hasContextToolbar(editor);
      },
      initValue: function () {
        var elm = getAnchorElement(editor);
        return !!elm ? getHref(elm) : "";
      },
      commands: [
        {
          type: "contextformtogglebutton",
          icon: "link",
          tooltip: "Link",
          primary: true,
          onSetup: function (buttonApi) {
            var node = editor.selection.getNode();
            buttonApi.setActive(!!getAnchorElement(editor, node));
            return toggleActiveState(editor)(buttonApi);
          },
          onAction: function (formApi) {
            var anchor = getAnchorElement(editor);
            var value = formApi.getValue();
            if (!anchor) {
              var attachState = {
                href: value,
                attach: noop,
              };
              var onlyText = isOnlyTextSelected(editor);
              var text = onlyText
                ? Optional.some(getAnchorText(editor.selection, anchor))
                    .filter(function (t) {
                      return t.length > 0;
                    })
                    .or(Optional.from(value))
                : Optional.none();
              link(editor, attachState, {
                href: value,
                text: text,
                title: Optional.none(),
                rel: Optional.none(),
                target: Optional.none(),
                class: Optional.none(),
              });
              formApi.hide();
            } else {
              editor.undoManager.transact(function () {
                editor.dom.setAttrib(anchor, "href", value);
                collapseSelectionToEnd(editor);
                formApi.hide();
              });
            }
          },
        },
        {
          type: "contextformbutton",
          icon: "unlink",
          tooltip: "Remove link",
          onSetup: onSetupLink,
          onAction: function (formApi) {
            unlink(editor);
            formApi.hide();
          },
        },
        {
          type: "contextformbutton",
          icon: "new-tab",
          tooltip: "Open link",
          onSetup: onSetupLink,
          onAction: function (formApi) {
            gotoSelectedLink(editor)();
            formApi.hide();
          },
        },
      ],
    });
  };

  function Plugin() {
    global.add("shortlink", function (editor) {
      setupButtons(editor);
      setupMenuItems(editor);
      setupContextMenu(editor);
      setupContextToolbars(editor);
      setupGotoLinks(editor);
      register(editor);
      setup(editor);
    });
  }

  Plugin();
})();
