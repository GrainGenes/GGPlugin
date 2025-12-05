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
                console.log("plugin: LogoButton",args);

                let thisB = this;
                let browser = this.browser;
                let conf = browser.config;
                let dataRoot = conf.baseUrl + conf.dataRoot;
                dataRoot = conf.dataRoot;

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