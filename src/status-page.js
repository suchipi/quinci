/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
import type { Queues } from "./create-queues";
const url = require("url");
const Handlebars = require("handlebars");

const template: ({
  queues: Array<{
    name: string,
    jobs: Array<{
      uid: string,
      commitSha: string,
      status: string,
      code: number | string,
      selected: boolean,
      output: string,
      createdAt: string,
    }>,
  }>,
}) => string = Handlebars.compile(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>QuinCI Job Status</title>
      <style>
        ul {
          list-style-type: none;
          padding: 0;
        }
        p {
          margin: 0.5em 0;
        }
        li {
          background-color: #f5f5f5;
          padding: 1em;
          margin: 1em 0;
          border-radius: 4px;
        }
        h3 {
          margin: 0;
        }
        .running {
          background-color: #fffbd3;
        }
        .success {
          background-color: #dffbdf;
        }
        .failure, .error {
          background-color: #ffe6e6;
        }
      </style>
    </head>
    <body>
      <h1>QuinCI Job Status</h1>

      {{#each queues}}
        <article id="queue-{{this.name}}">
          <a href="/#queue-{{this.name}}">
            <h2>{{this.name}}</h2>
          </a>
          {{#if this.jobs.length}}
            <ul>
              {{#each this.jobs}}
                <li id="job-{{this.uid}}" class="{{this.status}}">
                  <a href="/?{{this.uid}}#job-{{this.uid}}">
                    <h3>{{this.createdAt}}</h3>
                  </a>
                  <p>Git SHA: {{this.commitSha}}</p>
                  <p>Status: {{this.status}}</p>
                  {{#if this.running}}
                    <p>
                      <a href="/cancel?jobId={{this.uid}}">Cancel Job</a>
                    </p>
                  {{else}}
                    <p>Exit Code: {{this.code}}</p>
                  {{/if}}
                  <details {{#if this.selected}}open{{/if}}>
                    <summary>Output</summary>
                    <pre><code>{{this.output}}</code></pre>
                  </details>
                </li>
              {{/each}}
            </ul>
          {{else}}
            No jobs yet
          {{/if}}
        </article>
      {{/each}}
    </body>
  </html>
`);

module.exports = function statusPage(
  queues: Queues,
  req: IncomingMessage,
  res: ServerResponse,
  next: (err: ?Error) => void
) {
  const urlObj = url.parse(req.url);

  res.statusCode = 200;
  const templateData = {
    queues: queues.getAllJobsForQueues().map(({ jobName, jobs }) => {
      return {
        name: jobName,
        // Reverse jobs here so that most recent jobs are at the top.
        jobs: [...jobs].reverse().map((job) => ({
          uid: job.uid,
          commitSha: job.commitSha,
          status: job.status,
          running: job.status === "running",
          code: job.runResult.code,
          selected: urlObj.query === job.uid,
          output: job.runResult.output,
          createdAt: job.createdAt.toString(),
        })),
      };
    }),
  };
  res.write(template(templateData));
  res.end();
};
