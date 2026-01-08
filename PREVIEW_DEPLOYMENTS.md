# PR Preview Deployments

This project automatically creates preview deployments for every pull request, making it easy to test changes before merging.

## How It Works

When you create or update a pull request:

1. GitHub Actions automatically builds your changes
2. The build is deployed to a unique URL: `https://ketels.github.io/tune-time-traveler/pr-{NUMBER}/`
3. A comment is posted on your PR with the preview link
4. When the PR is closed/merged, the preview is automatically cleaned up

## Preview URLs

Each PR gets a unique URL based on its number:
- PR #1: `https://ketels.github.io/tune-time-traveler/pr-1/`
- PR #42: `https://ketels.github.io/tune-time-traveler/pr-42/`
- etc.

## Testing Spotify OAuth in Previews

To test Spotify login in a PR preview:

### Option 1: Add Specific Preview URL
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Open your app settings
3. Add redirect URI: `https://ketels.github.io/tune-time-traveler/pr-{NUMBER}/callback`
4. Replace `{NUMBER}` with your PR number (e.g., `pr-123`)
5. Click "Save"

### Option 2: Use Wildcard (if supported)
Some Spotify apps may support wildcard patterns:
- Try adding: `https://ketels.github.io/tune-time-traveler/pr-*/callback`
- This would work for all PR previews

**Note:** The PR comment will include the exact redirect URI you need to add.

## Workflow Details

### Trigger Events
- `opened` - When a new PR is created
- `synchronize` - When new commits are pushed to the PR
- `reopened` - When a closed PR is reopened
- `closed` - Cleans up the preview

### Build Process
1. Checks out your PR branch
2. Modifies `vite.config.ts` to use PR-specific base path
3. Builds the app with environment variables from GitHub Actions
4. Deploys to `gh-pages` branch in a subdirectory

### Cleanup
When a PR is closed or merged:
- The preview directory is removed from `gh-pages`
- A cleanup comment is posted on the PR

## Environment Variables

Preview builds use the same environment variables as production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SPOTIFY_CLIENT_ID`

These are configured in **Repository Settings → Secrets and variables → Actions**.

## Limitations

1. **Spotify Redirect URIs**: You may need to manually add each PR's redirect URI to Spotify
2. **Build Time**: First-time builds may take 2-3 minutes
3. **Storage**: Each preview adds ~1-2MB to the `gh-pages` branch

## Troubleshooting

### Preview Not Deploying
- Check the "Actions" tab in GitHub for build errors
- Ensure all required environment variables are set
- Check that you have write permissions on the repository

### Preview URL Not Working
- Wait 1-2 minutes after the comment appears for GitHub Pages to update
- Clear browser cache or try incognito mode
- Check browser console for errors

### Spotify Login Fails in Preview
- Verify you added the correct redirect URI to Spotify
- URL must exactly match: `https://ketels.github.io/tune-time-traveler/pr-{NUMBER}/callback`
- Check that Supabase Edge Function is deployed and has correct secrets

## Manual Cleanup

If a preview wasn't automatically cleaned up:

```bash
# Clone gh-pages branch
git clone --branch gh-pages https://github.com/ketels/tune-time-traveler.git gh-pages-repo

# Remove old preview
cd gh-pages-repo
rm -rf pr-{NUMBER}

# Commit and push
git add .
git commit -m "Remove old preview for PR #{NUMBER}"
git push
```

## Disabling Preview Deployments

To disable automatic previews, delete or rename:
`.github/workflows/preview.yml`
