const core = require('@actions/core');
const github = require('@actions/github');

const main = async () => {
  try {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const token = core.getInput('token', { required: true });

    const octokit = new github.getOctokit(token);                //octokit is used to call GitHub's REST API endpoints

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });
    
    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0
    };

    diffData = changedFiles.reduce((acc, file) => {            //array.Reduce() function used to return a single array element
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);

    for (const file of changedFiles) {                    //loop over all the files in PR and accordingly add labels based on file extensions

      const fileExtension = file.filename.split('.').pop();
      switch(fileExtension) {
        case 'md':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['markdown'],
          });
        case 'js':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['javascript'],
          });
        case 'yml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          });
        case 'yaml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          });
      }
    }

    await octokit.rest.issues.createComment({             //create comment on PRs with file change summary
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull Request #${pr_number} has been updated with: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n
      `
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
