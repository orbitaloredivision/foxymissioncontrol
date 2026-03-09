#!/bin/bash
#
# Anonymize git history - replace previous contributor identity with a random name.
# Run from project root. Creates a backup branch before rewriting.
#
# Usage: ./tools/anonymize-history.sh
#
# After running:
# 1. Add new remote: git remote add new-origin <new-repo-url>
# 2. Force push: git push new-origin main --force
# 3. Remove old remote if desired: git remote remove origin
# 4. Rename: git remote rename new-origin origin
#

set -e
cd "$(git rev-parse --show-toplevel)"

# Identity to replace (your current identity in commits)
OLD_AUTHOR_NAME="tarassych"
OLD_AUTHOR_EMAIL="taras.sych@gmail.com"

# Random/anonymous replacement identity (edit if you want a different name)
NEW_AUTHOR_NAME="${NEW_AUTHOR_NAME:-Contributor}"
NEW_AUTHOR_EMAIL="${NEW_AUTHOR_EMAIL:-contributor@users.noreply.local}"

echo "This will rewrite ALL commit history."
echo "  Replacing: $OLD_AUTHOR_NAME <$OLD_AUTHOR_EMAIL>"
echo "  With:      $NEW_AUTHOR_NAME <$NEW_AUTHOR_EMAIL>"
echo ""
echo "A backup branch 'backup-before-anonymize' will be created."
echo "The old remote will NOT be modified - you'll add the new repo manually."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# Create backup branch
git branch backup-before-anonymize 2>/dev/null || true
echo "Backup branch created: backup-before-anonymize"

# Rewrite history
git filter-branch -f --env-filter "
if [ \"\$GIT_AUTHOR_NAME\" = \"$OLD_AUTHOR_NAME\" ] || [ \"\$GIT_AUTHOR_EMAIL\" = \"$OLD_AUTHOR_EMAIL\" ]; then
  export GIT_AUTHOR_NAME=\"$NEW_AUTHOR_NAME\"
  export GIT_AUTHOR_EMAIL=\"$NEW_AUTHOR_EMAIL\"
fi
if [ \"\$GIT_COMMITTER_NAME\" = \"$OLD_AUTHOR_NAME\" ] || [ \"\$GIT_COMMITTER_EMAIL\" = \"$OLD_AUTHOR_EMAIL\" ]; then
  export GIT_COMMITTER_NAME=\"$NEW_AUTHOR_NAME\"
  export GIT_COMMITTER_EMAIL=\"$NEW_AUTHOR_EMAIL\"
fi
if [ \"\$GIT_COMMITTER_EMAIL\" = \"noreply@github.com\" ] && [ \"\$GIT_COMMITTER_NAME\" = \"GitHub\" ]; then
  export GIT_COMMITTER_NAME=\"$NEW_AUTHOR_NAME\"
  export GIT_COMMITTER_EMAIL=\"$NEW_AUTHOR_EMAIL\"
fi
" --tag-name-filter cat -- --all

echo ""
echo "Done. Verify with: git log --format='%an <%ae>' | sort -u"
echo ""
echo "Next steps:"
echo "  1. git remote add new-origin <YOUR_NEW_REPO_URL>"
echo "  2. git push new-origin main --force"
echo "  3. git remote remove origin"
echo "  4. git remote rename new-origin origin"
echo ""
echo "To restore original history: git reset --hard backup-before-anonymize"
