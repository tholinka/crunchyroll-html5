# HTML5 player for Crunchyroll
We really don't like flash and want it killed ASAP. However, there's currently
no HTML5 player available for Crunchyroll without having a subscription. So this
is the answer.

## Features
- A fully fledged HTML5 player that looks and feels a lot like YouTube's player.
- Video quality based on the selected quality shown under the video.
- Subtitles, we all want subtitles for our weeb shows. Otherwise the majority of
  us won't be able to enjoy our shows.

## Subtitle Engine
The browser is really bad at displaying subtitles so I had to find a library
that's able to render SSA/ASS subtitles. I've looked into just using WebVTT, but
Chrome was not really able to render them without a big black box around them.

So I've decided on using
[JavascriptSubtitlesOctopus](https://github.com/Dador/JavascriptSubtitlesOctopus),
which is an [emscripten](https://github.com/kripken/emscripten) project that
makes [libass](https://github.com/libass/libass) work in the browser with font
support. However, I've been required to make some changes to the project to
allow for dynamically loading the
[default.ttf](https://github.com/YePpHa/crunchyroll-html5/blob/master/vendor/JavascriptSubtitlesOctopus/default.ttf)
file and the
[fonts.conf](https://github.com/YePpHa/crunchyroll-html5/blob/master/vendor/JavascriptSubtitlesOctopus/fonts.conf)
file. I've also implemented a way to change the subtitle track without needing
to restart the WebWorker that's running the engine.

_All modifcations can be found [here](https://github.com/YePpHa/JavascriptSubtitlesOctopus)._

## Build
Building this project will result in a `crunchyroll-html5.user.js` file in the
`/dist` directory. To make it run on Crunchyroll you need to prepend a
userscript header that allows for script execution on
`http://www.crunchyroll.com/*`. I've currently not made it able to build for
each browser or userscript.

Before building make sure that you have installed [Node.js](https://nodejs.org/)
and [Yarn](https://yarnpkg.com/) (optional). After that you're required to
install the project dependencies through either Yarn or NPM.

Building is done by running the script `build`:
```
npm run build
```

## TODO
- Add option to change subtitles to other languages. Currently, only the default
  subtitle is displayed (in most cases this will be English).
- Add more fonts. Currently, only Arial is available. Should be quite easy, but
  some testing needs to be done for this.
- Investigate issues with subtitles being scaled 120% on the X axis and how to
  fix it. On some subtitles the scaleX is set to 120% instead of 100% and causes
  some weird strecthed out subtitles.
- Prevent user from right clicking on the video element. There's no reason for
  user's to be able to do that because the video can't be saved by the browser
  anyways and I'm not going to add that feature anyways.
- Consider moving the quality selection into the player.
- Look into adding Chromecast support.
- Add video tracking, so that Crunchyroll will remember how far you've gotten in
  your binge watching.
- Add an endscreen to indicate the user has finished the currently episode and
  perhaps automatically go to the next episode.
- Add the episode thumbnail on the video until the episode has loaded.
- Add multiple versions of this project for userscripts, Chrome, Firefox and
  more.
- Add a way for the player to remember user choices as how high or low the
  volume is.
- Look into reducing the size of the code in the userscript.

## Main Libraries
- [hls.js](https://github.com/video-dev/hls.js)
- [JavascriptSubtitlesOctopus](https://github.com/YePpHa/JavascriptSubtitlesOctopus)
