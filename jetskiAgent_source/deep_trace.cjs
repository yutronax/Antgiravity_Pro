
const fs = require('fs');
const path = 'c:/Users/YUSUF ÇİNAR/OneDrive/Belgeler/Masaüstü/projelerim/gitproje/jetskiAgent_source/main.js';

try {
    const t = fs.readFileSync(path, 'utf8');
    console.log('--- DEEP TRACE START ---');

    // 1. Trace 'aqr' usage (The Provider Component)
    // We want to see where aqr is rendered: A(aqr, { ... })
    const aqrSearch = /A\(aqr\s*,\s*\{/g;
    let match;
    console.log('\n[1] aqr Component Usages:');
    while ((match = aqrSearch.exec(t)) !== null) {
        console.log(`Found hierarchy at index ${match.index}:`);
        console.log(t.substring(match.index - 1000, match.index + 1000));
        console.log('-------------------');
    }

    // 2. Trace 'workspaceInfo' source
    // It's likely passed into the parent of aqr or calculated there.
    const wipSourceSearch = /workspaceInfo\s*:\s*[a-zA-Z_$][\w$]*/g;
    console.log('\n[2] workspaceInfo assignments:');
    let wipMatch;
    while ((wipMatch = wipSourceSearch.exec(t)) !== null) {
        // Look for cases that aren't inside the aqr definition itself (which starts at 7865131)
        if (Math.abs(wipMatch.index - 7865131) > 1000) {
            console.log(`Found assignment at index ${wipMatch.index}: ${wipMatch[0]}`);
            console.log(t.substring(wipMatch.index - 200, wipMatch.index + 200));
            console.log('-------------------');
        }
    }

    // 3. Trace 'geminiDir' and 'authority' connection to 'workspaceInfo'
    // Let's see if workspaceInfo object is built using these variables.
    const geminiDirSearch = /geminiDir/g;
    console.log('\n[3] geminiDir usages (potential mapping):');
    let gemMatch;
    while ((gemMatch = geminiDirSearch.exec(t)) !== null) {
        console.log(`Found geminiDir at index ${gemMatch.index}:`);
        console.log(t.substring(gemMatch.index - 200, gemMatch.index + 200));
        console.log('-------------------');
    }

    // 4. Look for the 'homeDir' and 'workspaceUris' population
    // These were seen in the default value of workspaceInfo at 9193854.
    // Let's find where they are actually set.
    const wsUriSearch = /workspaceUris\s*:/g;
    console.log('\n[4] workspaceUris population:');
    let wsMatch;
    while ((wsMatch = wsUriSearch.exec(t)) !== null) {
        console.log(`Found workspaceUris at index ${wsMatch.index}:`);
        console.log(t.substring(wsMatch.index - 300, wsMatch.index + 300));
        console.log('-------------------');
    }

    console.log('\n--- DEEP TRACE END ---');

} catch (e) {
    console.error('Error in deep trace:', e);
}
