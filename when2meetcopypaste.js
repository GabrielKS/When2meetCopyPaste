javascript:(function() {
/*
 * Bookmarklet for use at <https://www.when2meet.com/> allowing one to copy and paste data between schedules so that one doesn't have to manually enter this data so much.
 * Written in a few hours and not extensively tested. Will probably be updated in the future with bugfixes, documentation, and a better user interface.
 * Currently very dependent on When2meet implementation details.
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
 * In the long term, we... probably don't want to use prompt() as our user interface, but it's nice and simple and elegant for now.
 * Even with this compression, the stringified JSON may be too long if the schedule is very large. */

/* Every timestamp can be represented as o*step+i*step, where o is a constant integer offset and i is some integer. */
const step = 900;

/**
 * Compress from the timeAvail data structure
 */
function compressTimeAvail(ta) {
    const offset = Math.min(...Object.keys(ta).map(s => parseInt(s)))/step;
    const compressed = {"t0": offset, "ts": step, "ty": [], "tn": []};
    for (const time in ta) {
        (ta[time] ? compressed.ty : compressed.tn).push((time/step-offset));
    }
    return compressed;
}

/**
 * Decompress to the timeAvail data structure
 */
function decompressTimeAvail(compressed) {
    const offset = compressed.t0;
    const thisStep = compressed.ts;
    const ta = {"a": "b"};
    for (const time of compressed.ty) ta[(time+offset)*thisStep] = true;
    for (const time of compressed.tn) ta[(time+offset)*thisStep] = false;
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

/* Maximum number of characters we can pre-populate prompt() with -- experimentally determined to be 2000 on Chrome */
const charLimit = 2000;

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
        return -1;
    }
    return 1;
}

doPrompt();
})();