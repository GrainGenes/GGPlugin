/* 
 */

define(
    [
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/Deferred',
        'JBrowse/Plugin',
        'JBrowse/Util'
    ],
    function(
        declare,
        lang,
        Deferred,
        JBrowsePlugin,
        Util
    ) {
        return declare( JBrowsePlugin,
        {
            constructor: function( args ) {
                console.log("plugin: GGPlugin",args);

                let thisB = this;
                let browser = this.browser;
                let conf = browser.config;
                let dataRoot = conf.baseUrl + conf.dataRoot;
                dataRoot = conf.dataRoot;

                if (conf.ggsecure) {
                    // Prompt for password
                    let password = prompt("This dataset is password protected. Please enter the password:");
                    if (!password || password !== conf.ggsecure) {
                        document.open();
                        document.write(`
                        <!DOCTYPE html>
                        <html>
                            <head>
                            <title>`+conf.dataset_id+` Access denied</title>
                            <script>
                                console.clear();
                            </script>
                            <meta charset="utf-8">
                            </head>
                            <body>
                            <h1>`+conf.dataset_id+` is embargoed</h1>
                            <p>It will be available soon.</p>
                            </body>
                        </html>
                        `);
                        document.close();
                    }
                }
                // create function intercept after view initialization (because the view object doesn't exist before that)
                browser.afterMilestone( 'initView', function() {

                    /* banner in sidebar */
                    if (true) {
                        $('#hierarchicalTrackPane').prepend('<div id="gg-banner">loading pageinfo.html...</div>');

                        $.get(dataRoot+'/pageinfo.html',function( response) {
                            $( "#gg-banner" ).html( response );
                            $('#gg-banner').css({
                                'background-image': 'url("'+dataRoot+'/banner.jpg")',
                            });
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            console.error('Error loading HTML:', textStatus, errorThrown);
                        });
                    }
                });             
            }
        });
    }
)