import * as dotenv from "dotenv"

dotenv.config()

const githubPat = process.env.GITHUB_PAT

if (!githubPat) {
  console.log("No GITHUB_PAT")
  process.exit(1)
}

const repoOwner = "excalitech"
const repoName = "booking-demo"

async function run() {
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${githubPat}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `[Test] This is a test issue`,
      body: "Test body",
      labels: ["beta-feedback"]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error from GitHub API:", response.status, errorText)
  } else {
    console.log("Success")
  }
}

run()
