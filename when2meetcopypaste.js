javascript:(function() {
/*
 * Bookmarklet for use at <https://www.when2meet.com/> allowing one to copy and paste data between schedules so that one doesn't have to manually enter this data so much.
 * Written in a few hours and not extensively tested. Will probably be updated in the future with bugfixes, documentation, and a better user interface.
 * Currently very dependent on When2meet implementation details.
 * 
 * TO USE:
 *  1. Create a new bookmark on your bookmarks bar pointing to an arbitrary page.
 *  2. Delete the "URL" of the bookmark and instead paste in this entire file.
 *  3. Edit the name of the bookmark as desired.
 *  4. When you have a When2meet schedule open and you are signed in to it, you can click the bookmark to activate the tool.
 *  5. When used, the tool brings up a dialog where you can view and edit the schedule in text form.
 *  6. You can use the browser's built-in copy and paste functionality to copy and paste this schedule between multiple When2meet schedules.
 *  7. Click 'Cancel' to discard changes or 'OK' to save them.
 */

/**
 * Gets the raw (no timestamps) availability for a given user ID
 */
function getRawAvail(id) {
    return AvailableAtSlot.map(a => a.includes(id))
}

/**
 * Gets the availability for a given user ID and returns as a timestamp : availability dictionary
 */
function getTimeAvail(id) {
    const ra = getRawAvail(id);
    const ta = {};
    for (var i = 0; i < TimeOfSlot.length; i++) {
        ta[TimeOfSlot[i]] = ra[i]
    }
    return ta;
}

/**
 * For a given user ID and an availability data structure formatted as getTimeAvail produces, sets the state accordingly
 */
function setTimeAvail(id, ta) {
    for (var time in ta) {
        time = parseInt(time);
        const newAvail = ta[time];
        const i = TimeOfSlot.indexOf(time);
        if (i >= 0) {  /* Only do anything if the given time is actually an option */
            const oldAvail = AvailableAtSlot[i].indexOf(id) >= 0;

            /* If we're now available and we were unavailable before */
            if (newAvail && !oldAvail) AvailableAtSlot[i].push(id);

            /* If we're now unavailable and we were available before */
            else if (!newAvail && oldAvail) AvailableAtSlot[i].splice(AvailableAtSlot[i].indexOf(id), 1);
        }
    }
}

/**
 * Gets the time availability for the current user, if there is one, otherwise returns an empty dictionary
 */
function getCurrent() {
    return UserID ? getTimeAvail(UserID) : {};
}

/**
 * If there is a current user, sets the time availability for them, updates the display, and returns true
 * If there is no current user, returns false
 */
function setCurrent(ta) {
    if (!UserID) return false;
    setTimeAvail(UserID, ta);
    ReColorIndividual();
    ReColorGroup();
    return true;
}

/* Chrome only allows us to pre-populate prompt() with a maximum of 2000 characters. Thus, if we want to use prompt() as our user interface, we must compress.
 * In the long term, we might not want to use prompt() as our user interface, but it's nice and simple and elegant for now.
 * The current compression algorithm suffices for all but the largest schedules (which no one should be using anyway). It's easily possible to encode multiple schedule blocks in one character, which would allow us to handle the largest schedules currently possible, but right now I don't think this is worth sacrificing the readability of the schedule JSON for.
 */

/**
 * Compress from the timeAvail data structure
 * The basic strategy here is to find the "intervals" (which in practice correspond to days) on which there is a schedule block every 15 minutes, and then encode the availability for each interval as a string of 0s and 1s.
 */
function compressTimeAvail(ta) {
    /* Every timestamp can be represented as o*step+i*step, where o is a constant integer offset and i is some integer. */
    const step = 900;

    const allTimes = [];
    for (const time in ta) {
        allTimes.push(parseInt(time));
    }
    allTimes.sort();

    intervalOffsets = [];
    intervalLengths = [];
    var prevTime = NaN;
    var startI = NaN;
    for (var i = 0; i < allTimes.length; i++) {
        const time = allTimes[i];
        if (time != prevTime+step) {
            intervalOffsets.push(time);
            if (i != 0) intervalLengths.push(i-startI);
            startI = i;
        }
        prevTime = time;
    }
    intervalLengths.push(allTimes.length-startI);

    intervalStrings = [];
    for (var i = 0; i < intervalOffsets.length; i++) {
        const thisOffset = intervalOffsets[i];
        const thisLength = intervalLengths[i];
        var thisString = "";
        for (var j = 0; j < thisLength; j++) {
            const time = thisOffset+(j*step);
            thisString += (ta[time] ? "1" : "0");
        }
        intervalStrings[i] = thisString;
    }

    const intervals = [];
    for (var i = 0; i < intervalOffsets.length; i++) {
        intervals.push({"offset": intervalOffsets[i], "avail": intervalStrings[i]});
    }

    return {"step": step, "intervals": intervals};
}

/**
 * Decompress to the timeAvail data structure
 */
function decompressTimeAvail(compressed) {
    const ta = {};
    const step = compressed.step;
    for (const interval of compressed.intervals) {
        for (var i = 0; i < interval.avail.length; i++) {
            ta[interval.offset+(i*step)] = (interval.avail[i] != "0");
        }
    }
    return ta;
}

/**
 * Sometimes JSON.stringify is altered to put quotes around arrays, which we don't want.
 * This caches the altered version, deletes it, lets us call the default JSON.stringify, then puts the altered version back.
 */
function myStringify(toStringify) {
    const tmpStringify = Array.prototype.toJSON;
    delete Array.prototype.toJSON;
    const result = JSON.stringify(toStringify);
    Array.prototype.toJSON = tmpStringify;
    return result;
}

/**
 * The user interface!
 *  1. If there is no current user, generates an error message and returns -2
 *  2. If the current user data is too large to be displayed, generates an error message and returns -2
 *  3. Otherwise, generates a prompt with the current user data
 *  4. User may change this data
 *  5. If user clicks "Cancel," state is not changed and we return 0
 *  6. If user clicks "OK":
 *      a. If input validates, state is updated accordingly and we return 1
 *      b. If input does not validate, state is not changed and we return -1
 */
function doPrompt() {
    /* Maximum number of characters we can pre-populate prompt() with -- experimentally determined to be 2000 on Chrome and more than that on Firefox and Safari */
    const charLimit = 2000;

    if (typeof UserID == "undefined" || typeof AvailableAtSlot == "undefined" || typeof TimeOfSlot == "undefined") {
        if (location.hostname.split(".").reverse().slice(0, 2).join(".") == "com.when2meet") alert("Your version of this tool seems to no longer work. Please try reinstalling.");
        else alert("You need to be looking at a When2meet schedule to use this tool.")
        return;
    }

    if (!UserID) {
        alert("To use this tool, you must be signed in.");
        return -2;
    }

    const before = myStringify(compressTimeAvail(getCurrent()));
    if (before.length > charLimit) {
        alert("Unfortunately, your schedule is too large to work with this tool. :(");
        return -2;
    }
    
    const after = prompt("Here is the schedule, which may be copied, pasted, and edited. Press 'Cancel' to discard changes or 'OK' to save changes.", before);
    if (!after) return 0;
    try {
        const parsed = JSON.parse(after);
        const decompressed = decompressTimeAvail(parsed);
        if (!setCurrent(decompressed)) return -1;
    } catch(e) {
        console.error(e);
        return -1;
    }
    return 1;
}

doPrompt();
})();