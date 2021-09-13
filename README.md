# Background
## What is this?
[When2meet](https://www.when2meet.com/) is an excellent, lightweight scheduling tool. At Pomona College, we frequently use it for scheduling club meetings and other group gatherings. However, there is a major downside: you have to enter your whole schedule from scratch every time you want to fill one out.

One day, in the shower, I had the thought: what if there was a way to "copy" and "paste" schedules across multiple When2meet schedules? It would maintain the lightweight nature of the tool but save lots of time. Several hours later, **When2meetCopyPaste** was born.

## How does it work?
When2meetCopyPaste is structured as a "[bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet)". A bookmarklet is when you bookmark some code instead of a page, so when you click on the bookmark, the code runs on the existing page. The code that makes up When2meet gets your schedule from the page, processes it into text, and displays the text so you can edit it or copy/paste between multiple When2meet schedules.

## Seems unsafe…
In general, it is not a great idea to run code you don't understand from an untrusted source.
 1. That's one of the reasons I haven't obfuscated or minimized my code at all (I even left the comments in), so you can look at it and understand exactly what's going on.
 2. In any case, the code is running within the When2meet page, not loose on your computer, so you only need to trust me as much as you trust the makers of the When2meet page itself.

# Installation
### The easy way
<div id="installation-blurb">
Please go <a href="https://gabrielks.github.io/When2meetCopyPaste/#the-easy-way">here</a>, where you will find a page much like this one containing a link you can just drag and drop to your bookmarks bar to install.
</div>

### The hard way
If that isn't working for you or you'd like to supervise the process in more detail, follow these steps:
 1. Create a new bookmark on your bookmarks bar pointing to an arbitrary page.
 2. Delete the "URL" of the bookmark and instead paste in [this](https://gabrielks.github.io/When2meetCopyPaste/when2meetcopypaste.js) entire file.
 3. Edit the name of the bookmark as desired.

# Use
To use this tool, go to a When2meet schedule, sign in as usual, and then click on the bookmarklet you just installed in your bookmarks bar as if it were a button on the page. You should see a dialog box that displays your schedule in text form. You can edit the schedule from there or copy and paste it between multiple When2meet schedules using your browser's built-in copy and paste functionality. When you're done, click 'Cancel' to discard changes or 'OK' to save them.

# Credits
This tool was created by Gabriel Konar-Steenberg. You can:
 * View my other projects on my [GitHub page](https://github.com/GabrielKS)
 * Learn more about me on my [LinkedIn page](https://www.linkedin.com/in/gabriel-konar-steenberg/)

<script>
    <!--
        (function() {
            document.getElementById("installation-blurb").innerHTML = "Loading…. If this doesn't load, please use the other installation method."
            const xr = new XMLHttpRequest();
            function loadInstallationBlurb() {
                if (xr.readyState != xr.DONE) return;
                if (xr.status == 200) {
                    const response = xr.responseText;
                    const contents = "Just drag the following link to your boomarks bar: <a id=\"bookmarklet\" href=\"javascript:(function() {alert('Error! Please use the other installation method. :(')})();\">W2MCV</a>. You may then rename the bookmark if you like.";
                    document.getElementById("installation-blurb").innerHTML = contents;
                    document.getElementById("bookmarklet").href = response;
                }
                else {
                    document.getElementById("installation-blurb").innerHTML = "Error! Please use the other installation method. :("
                }
            }
            xr.onreadystatechange = loadInstallationBlurb;
            xr.open("GET", "https://gabrielks.github.io/When2meetCopyPaste/when2meetcopypaste.js");
            xr.send();
        })();
    -->
</script>