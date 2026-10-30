# GGPlugin

In the JBrowse root, create plugins/GGPlugin and place the files in this project there.

The plugin reuses an existing global `window.jQuery`, regardless of its version.
If none is available, it automatically loads jQuery 3.7.1 from
`https://code.jquery.com/jquery-3.7.1.min.js`, with a Subresource Integrity check.
No jQuery or jQuery UI script tags are needed in JBrowse's index.html.

After jQuery is available, the plugin loads jQuery UI 1.14.1 and its base theme:

- `https://code.jquery.com/ui/1.14.1/jquery-ui.min.js`
- `https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css`

Both use Subresource Integrity checks. An existing jQuery UI dialog widget is
reused instead of loading the script again. jQuery UI 1.14.1 supports jQuery
1.12.0+, 2.2.0+, and 3.6.0+, including the bundled CDN choice of jQuery 3.7.1.
The dialog widget supports scripts in the dataset's banner content.

When loading from the CDN, the browser must be able to reach `code.jquery.com`.
Any Content Security Policy must allow scripts, styles, and theme images from
that origin. The sidebar waits for jQuery, jQuery UI, and the theme before
loading; a CDN failure is reported in the browser console.

### Plugin Configuration

In the dataset's trackList.json, enable the plugin:

```json
{
  "plugins": ["GGPlugin"]
}
```

The plugin inserts a banner into the hierarchical track sidebar after the view
initializes. Place `pageinfo.html` and `banner.jpg` in the dataset's data root to
provide the banner content and background image.
