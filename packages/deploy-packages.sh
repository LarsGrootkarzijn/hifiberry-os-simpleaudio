#!/bin/sh

set -eu
export GPG_TTY=$(tty)
# ============================================================
# Aptly Repository Publisher
#
# Usage:
#   ./publish-repo.sh dev
#   ./publish-repo.sh stable
#
# DEV:
#   Publishes to dev/trixie
#
# STABLE:
#   Publishes to stable/trixie
# ============================================================

# ------------------------------------------------------------
# Load environment
# ------------------------------------------------------------

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

if [ -f "$PROJECT_ROOT/.env" ]; then
    . "$PROJECT_ROOT/.env"
else
    echo "ERROR: .env not found:"
    echo "       $PROJECT_ROOT/.env"
    exit 1
fi

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

CHANNEL="${1:-}"

case "$CHANNEL" in
    dev)
        APTLY_REPO="hbos-${DISTRIBUTION}-sa-dev"
        PUBLISH_PREFIX="dev"
        ;;
    stable)
        APTLY_REPO="hbos-${DISTRIBUTION}-sa"
        PUBLISH_PREFIX="stable"
        ;;
    *)
        echo "Usage: $0 {dev|stable}"
        exit 1
        ;;
esac

REMOTE="${REPO_USER}@${REPO_HOST}"

SSH="ssh -t -p ${REPO_PORT} -i ${SSH_KEY} ${REMOTE}"
SCP="scp -P ${REPO_PORT} -i ${SSH_KEY}"

INCOMING="${INCOMING_PACKAGES}"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"

SNAPSHOT="${APTLY_REPO}-${TIMESTAMP}"

uploaded=0
skipped=0

# ------------------------------------------------------------
# Header
# ------------------------------------------------------------

echo
echo "========================================"
echo " Aptly Repository Publisher"
echo "========================================"
echo
echo "Channel     : $CHANNEL"
echo "Repo        : $APTLY_REPO"
echo "Publication : $PUBLISH_PREFIX/$DISTRIBUTION"
echo "Server      : $REPO_HOST"
echo

# ------------------------------------------------------------
# Check incoming directory
# ------------------------------------------------------------

echo "==> Checking repository server..."

if ! $SSH "test -d '$INCOMING'"; then
    echo "ERROR: incoming directory does not exist:"
    echo "       $INCOMING"
    exit 1
fi

echo "SUCCESS: repository server reachable"

# ------------------------------------------------------------
# Upload packages
# ------------------------------------------------------------

echo
echo "==> Looking for packages..."

found=0

for deb in */*.deb; do

    if [ ! -f "$deb" ]; then
        continue
    fi

    basename_deb=$(basename "$deb")

    case "$basename_deb" in
        *-dbgsym_*.deb)
            continue
            ;;
    esac

    found=1

    basename_deb=$(basename "$deb")

    echo
    echo "Package: $basename_deb"

    # Check if package already exists remotely
    if $SSH "[ -f '${INCOMING}/${basename_deb}' ]"; then
        echo "SKIPPED: already exists on repository server"
        skipped=$((skipped + 1))
        continue
    fi

    echo "Uploading..."

    if $SCP "$deb" "${REMOTE}:${INCOMING}/"; then
        echo "SUCCESS: uploaded"
        uploaded=$((uploaded + 1))
    else
        echo "ERROR: upload failed"
        exit 1
    fi

done

if [ "$found" -eq 0 ]; then
    echo "No .deb packages found."
    exit 0
fi

echo
echo "========================================"
echo " Upload complete"
echo "========================================"
echo "Uploaded : $uploaded"
echo "Skipped  : $skipped"
echo

# ------------------------------------------------------------
# Add packages to Aptly repository
# ------------------------------------------------------------

echo "==> Adding packages to Aptly repository: $APTLY_REPO"

if ! $SSH \
    "sudo -u aptly aptly repo add '$APTLY_REPO' '$INCOMING'/*.deb"; then

    echo "ERROR: Failed to add packages to Aptly repository"
    exit 1
fi

echo "SUCCESS: packages added to $APTLY_REPO"

# ------------------------------------------------------------
# Create snapshot
# ------------------------------------------------------------

echo
echo "==> Creating snapshot:"
echo "    $SNAPSHOT"

if ! $SSH \
    "sudo -u aptly aptly snapshot create \
    '$SNAPSHOT' \
    from repo '$APTLY_REPO'"; then

    echo "ERROR: Failed to create snapshot"
    exit 1
fi

echo "SUCCESS: snapshot created"

# ------------------------------------------------------------
# Publish / Switch
# ------------------------------------------------------------

echo
echo "==> Publishing $SNAPSHOT..."
echo "    Publication: $PUBLISH_PREFIX/$DISTRIBUTION"

# Check whether the publication already exists.
if $SSH \
    "sudo -u aptly aptly publish list | grep -q '${PUBLISH_PREFIX}/${DISTRIBUTION}'"; then

    echo "Existing publication found."
    echo "Switching to new snapshot..."

    if ! $SSH \
        "sudo -u aptly aptly publish switch \
        '$DISTRIBUTION' \
        '$PUBLISH_PREFIX' \
        '$SNAPSHOT'"; then

        echo "ERROR: Failed to switch publication"
        exit 1
    fi

    echo "SUCCESS: publication switched"

else

    echo "No existing publication found."
    echo "Creating publication..."

    if ! $SSH \
        "sudo -u aptly aptly publish snapshot \
        -distribution='$DISTRIBUTION' \
        -component='$COMPONENT' \
        '$SNAPSHOT' \
        '$PUBLISH_PREFIX'"; then

        echo "ERROR: Failed to create publication"
        exit 1
    fi

    echo "SUCCESS: publication created"

fi

# ------------------------------------------------------------
# Verify publication
# ------------------------------------------------------------

echo
echo "==> Verifying publication..."

if ! $SSH \
    "sudo -u aptly aptly publish list | grep -q '${PUBLISH_PREFIX}/${DISTRIBUTION}'"; then

    echo "ERROR: Publication verification failed"
    exit 1
fi

echo "SUCCESS: publication verified"

# ------------------------------------------------------------
# Finished
# ------------------------------------------------------------

echo
echo "========================================"
echo " Publish successful"
echo "========================================"
echo
echo "Channel     : $CHANNEL"
echo "Repo        : $APTLY_REPO"
echo "Snapshot    : $SNAPSHOT"
echo "Publication : $PUBLISH_PREFIX/$DISTRIBUTION"
echo
echo "Repository:"
echo "https://repo.grootkarzijn.com/$CHANNEL/"
echo
