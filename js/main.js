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
        let jqueryReady;
        let jqueryUIReady;

        function loadJQuery() {
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery) {
                return Promise.resolve(window.jQuery);
            }
            if (!jqueryReady) {
                jqueryReady = new Promise(function(resolve, reject) {
                    const script = document.createElement('script');
                    script.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
                    script.integrity = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
                    script.crossOrigin = 'anonymous';
                    script.onload = function() {
                        if (!window.jQuery || window.jQuery.fn.jquery !== '3.7.1') {
                            reject(new Error('GGPlugin requires jQuery 3.7.1.'));
                            return;
                        }
                        resolve(window.jQuery);
                    };
                    script.onerror = function() {
                        reject(new Error('GGPlugin could not load jQuery 3.7.1 from ' + script.src));
                    };
                    document.head.appendChild(script);
                });
            }
            return jqueryReady;
        }

        function loadJQueryUI($) {
            if (!jqueryUIReady) {
                const themeReady = new Promise(function(resolve, reject) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css';
                    link.integrity = 'sha256-upLUpAU8h+pO1VS/mXF6vWuo3QKtT9m/SUElNjr1CX8=';
                    link.crossOrigin = 'anonymous';
                    link.onload = resolve;
                    link.onerror = function() {
                        reject(new Error('GGPlugin could not load the jQuery UI theme from ' + link.href));
                    };
                    document.head.appendChild(link);
                });
                const scriptReady = new Promise(function(resolve, reject) {
                    if (typeof $.fn.dialog === 'function') {
                        resolve();
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = 'https://code.jquery.com/ui/1.14.1/jquery-ui.min.js';
                    script.integrity = 'sha256-AlTido85uXPlSyyaZNsjJXeCs07eSv3r43kyCVc8ChI=';
                    script.crossOrigin = 'anonymous';
                    script.onload = function() {
                        if (typeof $.fn.dialog !== 'function') {
                            reject(new Error('GGPlugin requires the jQuery UI dialog widget.'));
                            return;
                        }
                        resolve();
                    };
                    script.onerror = function() {
                        reject(new Error('GGPlugin could not load jQuery UI from ' + script.src));
                    };
                    document.head.appendChild(script);
                });
                jqueryUIReady = Promise.all([themeReady, scriptReady]).then(function() {
                    return $;
                });
            }
            return jqueryUIReady;
        }

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
                    loadJQuery().then(loadJQueryUI).then(function($) {
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
                    }).catch(function(error) {
                        console.error('GGPlugin could not initialize the sidebar banner:', error);
                    });
                });             
            }
        });
    }
)