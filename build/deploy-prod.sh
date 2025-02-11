#!/bin/sh -exu

git config --global user.email "destinyitemmanager@gmail.com"
git config --global user.name "DIM Release Bot"

if [ "$PATCH" = 'true' ]; then
  VERSION=$(npm version patch --no-git-tag-version | sed 's/v//')
else
  VERSION=$(npm version minor --no-git-tag-version | sed 's/v//')
fi

awk '/## Next/{flag=1;next}/##/{flag=0}flag' docs/CHANGELOG.md >release-notes.txt

# update changelog
OPENSPAN='\<span class="changelog-date"\>'
CLOSESPAN='\<\/span\>'
DATE=$(TZ="America/Los_Angeles" date +"%Y-%m-%d")
perl -i'' -pe"s/^## Next/## Next\n\n## $VERSION $OPENSPAN($DATE)$CLOSESPAN/" docs/CHANGELOG.md

# Add these other changes to the version commit
git add -u
git commit -m"$VERSION"
git tag "v$VERSION"

# build and check
pnpm build:release
pnpm syntax

# rsync the files onto the remote host using SSH keys
./build/rsync-deploy.sh

# push tags and changes
git push --tags origin master:master

# publish a release on GitHub
gh release create "v$VERSION" -F release-notes.txt -t "$VERSION"
