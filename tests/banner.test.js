const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/main.css'), 'utf8');
const bannerCss = fs.readFileSync(path.join(root, 'css/banner-logos.css'), 'utf8');

for (const scenario of ['no legacy logos', 'legacy logos', 'plain content', 'info-content only', 'missing pageinfo']) {
    test(`banner shows shared logos with ${scenario}`, async () => {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        try {
            await page.route('http://ggplugin.test/plugins/GGPlugin/img/*', route => {
                const file = path.basename(new URL(route.request().url()).pathname);
                return route.fulfill({ contentType: 'image/png', body: fs.readFileSync(path.join(root, 'img', file)) });
            });
            await page.route('http://ggplugin.test/plugins/GGPlugin/css/banner-logos.css*', route =>
                route.fulfill({ contentType: 'text/css', body: bannerCss }));
            await page.route('http://ggplugin.test/', route =>
                route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
            await page.goto('http://ggplugin.test/');
            await page.setContent('<div id="hierarchicalTrackPane" style="width: 410px"></div>');
            await page.addStyleTag({ content: css });
            await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
            await page.evaluate(scenario => {
                const oldLogos = scenario === 'legacy logos'
                    ? '<span style="float:left;padding-right:10px"><a href="#"><img id="GGlogo"></a> <a href="#"><img id="T3logo"></a></span>'
                    : '';
                const content = oldLogos + '<h1>Dataset title wrapping beside the logos</h1><p>Dataset information</p>';
                const html = (scenario === 'plain content' ? content :
                    '<div class="info-content">' +
                    (scenario === 'info-content only' ? content : '<div class="info-text">' + content + '</div>') +
                    '</div>') +
                    '<div class="banner-test-dialog" style="height: 220px">Dialog content</div>' +
                    '<script>$(function() { $(".banner-test-dialog").appendTo(document.body).hide(); });' +
                    'window.bannerScriptRan = true</script>';
                window.jQuery.fn.dialog = function() {};
                const slideDown = window.jQuery.fn.slideDown;
                window.jQuery.fn.slideDown = function(duration) {
                    window.slideDuration = duration;
                    window.slideStarted = performance.now();
                    window.slideSamples = [];
                    const sample = () => {
                        const elapsed = performance.now() - window.slideStarted;
                        window.slideSamples.push({
                            elapsed,
                            height: document.querySelector('.gg-banner-reveal').getBoundingClientRect().height,
                            bannerHeight: document.querySelector('#gg-banner').getBoundingClientRect().height
                        });
                        if (!window.slideFinished) requestAnimationFrame(sample);
                    };
                    requestAnimationFrame(sample);
                    return slideDown.call(this, duration, function() {
                        window.slideFinished = performance.now();
                    });
                };
                window.jQuery.get = function(url, callback) {
                    window.initialHeight = document.querySelector('#gg-banner').getBoundingClientRect().height;
                    if (scenario === 'missing pageinfo') {
                        return { fail(handler) { setTimeout(() => handler({}, 'error', 'Not Found'), 0); } };
                    }
                    setTimeout(() => callback(html), 0);
                    return { fail() {} };
                };
                window.define = (dependencies, factory) => {
                    window.plugin = factory((base, methods) => methods, {}, {}, {}, {});
                };
            }, scenario);
            await page.addScriptTag({ content: source });
            await page.evaluate(() => {
                const browser = {
                    config: { dataRoot: '/dataset' },
                    afterMilestone(name, callback) { callback(); }
                };
                window.plugin.constructor.call({ browser }, { location: 'plugins/GGPlugin' });
            });
            await page.waitForSelector('#gg-banner .gg-banner-logos img:nth-child(1)');
            if (scenario !== 'missing pageinfo') {
                await page.waitForFunction(() => window.bannerScriptRan === true);
            }
            await page.waitForFunction(() => window.slideFinished > 0);
            await page.waitForFunction(() =>
                [...document.querySelectorAll('#gg-banner .gg-banner-logos img')].every(image => image.complete));
            const result = await page.evaluate(() => {
                const logos = [...document.querySelectorAll('#gg-banner .gg-banner-logos img')];
                const heading = document.querySelector('#gg-banner h1');
                const bannerBox = document.querySelector('#gg-banner').getBoundingClientRect();
                const groupBox = document.querySelector('#gg-banner .gg-banner-logos').getBoundingClientRect();
                const logoBox = logos[1].getBoundingClientRect();
                const text = document.createRange();
                if (heading) {
                    text.setStart(heading.firstChild, 0);
                    text.setEnd(heading.firstChild, 7);
                }
                return {
                    images: logos.map(image => ({
                        alt: image.alt,
                        filename: image.currentSrc.split('/').pop(),
                        loaded: image.naturalWidth > 0,
                        height: image.getBoundingClientRect().height
                    })),
                    links: logos.map(image => image.parentElement.href),
                    titles: logos.map(image => image.parentElement.title),
                    oldImages: document.querySelectorAll('#GGlogo, #T3logo').length,
                    floats: document.querySelectorAll('#gg-banner .gg-banner-logos').length,
                    float: getComputedStyle(document.querySelector('#gg-banner .gg-banner-logos')).float,
                    offsetLeft: groupBox.left - bannerBox.left,
                    offsetTop: groupBox.top - bannerBox.top,
                    headingLeft: heading && text.getBoundingClientRect().left,
                    headingTop: heading && heading.getBoundingClientRect().top - bannerBox.top,
                    logoRight: logoBox.right,
                    headingText: heading && heading.textContent,
                    scriptRan: window.bannerScriptRan === true,
                    initialHeight: window.initialHeight,
                    slideDuration: window.slideDuration,
                    elapsed: window.slideFinished - window.slideStarted,
                    samples: window.slideSamples,
                    finalHeight: bannerBox.height
                };
            });
            assert.deepEqual(result.images, [
                { alt: 'GrainGenes', filename: 'GG3.png', loaded: true, height: 50 },
                { alt: 'T3 Wheat', filename: 'T3_black.png', loaded: true, height: 50 }
            ]);
            assert.deepEqual(result.links, ['https://wheat.pw.usda.gov/', 'https://triticeaetoolbox.org/wheat/']);
            assert.deepEqual(result.titles, ['GrainGenes', 'The Triticeae Toolbox']);
            assert.equal(result.oldImages, 0);
            assert.equal(result.floats, 1);
            assert.equal(result.float, 'left');
            assert.equal(result.offsetLeft, 10);
            assert.equal(result.offsetTop, 10);
            assert.equal(result.initialHeight, 0);
            assert.equal(result.slideDuration, 1000);
            assert.ok(result.elapsed >= 950 && result.elapsed < 2000, `animation took ${result.elapsed}ms`);
            assert.ok(result.samples.some(sample =>
                sample.elapsed > 200 && sample.elapsed < 800 &&
                sample.height > 0 && sample.height < result.finalHeight));
            assert.ok(result.samples.every(sample => sample.height <= result.finalHeight + 1),
                'the banner must not expand beyond its final height');
            assert.ok(result.samples.filter(sample => sample.height > 0).every(sample =>
                Math.abs(sample.bannerHeight - result.finalHeight) < 1),
                'the background must remain at its final height throughout the reveal');
            if (scenario !== 'missing pageinfo') {
                assert.ok(result.headingLeft >= result.logoRight);
                assert.equal(result.headingTop, result.offsetTop);
                assert.equal(result.headingText, 'Dataset title wrapping beside the logos');
                assert.equal(result.scriptRan, true);
            }
        } finally {
            await browser.close();
        }
    });
}
