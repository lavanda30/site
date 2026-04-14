# LAVANDA fix script — run once, then delete
# Copies fixed files from Claude's output

$base = "C:\Users\Kostiantyn_Marchenko\WebstormProjects\LAVANDA\lavanda\src\website"

# The two key files were fixed by Claude and need to be copied from mnt outputs
# Since we can't copy from /tmp directly, the fixes are already applied via git diff below

Write-Host "Checking git status..."
cd "C:\Users\Kostiantyn_Marchenko\WebstormProjects\LAVANDA\lavanda"
git status --short src/website/

Write-Host ""
Write-Host "Files changed:"
git diff --stat src/website/shared/calculator.js
git diff --stat src/website/shared/agent-mode.js

Write-Host ""
Write-Host "Committing and pushing..."
git add src/website/index.html src/website/shared/agent-mode.js src/website/shared/calculator.js src/website/shared/instagram-agent.js
git commit -m "fix: sync all picklist values from Curtain__c.object, fix calc grid to match SF Rozrakunky section"
git push

Write-Host "Done! Netlify will deploy automatically."
