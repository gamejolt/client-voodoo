"use strict";
var PatcherState;
(function (PatcherState) {
    PatcherState[PatcherState["Start"] = 0] = "Start";
    PatcherState[PatcherState["Preparing"] = 1] = "Preparing";
    PatcherState[PatcherState["Download"] = 2] = "Download";
    PatcherState[PatcherState["PrepareExtract"] = 3] = "PrepareExtract";
    PatcherState[PatcherState["UpdateReady"] = 4] = "UpdateReady";
    PatcherState[PatcherState["Extract"] = 5] = "Extract";
    PatcherState[PatcherState["Cleanup"] = 6] = "Cleanup";
    PatcherState[PatcherState["Uninstall"] = 7] = "Uninstall";
    PatcherState[PatcherState["Rollback"] = 8] = "Rollback";
    PatcherState[PatcherState["Finished"] = 9] = "Finished";
})(PatcherState = exports.PatcherState || (exports.PatcherState = {}));
