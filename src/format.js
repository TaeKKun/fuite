import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import { markdownTable } from 'markdown-table'

function formatLeakingObjects (objects) {
  const tableData = [[
    'Object',
    '# added',
    'Retained size increase'
  ]]

  for (const { name, retainedSizeDeltaPerIteration, countDeltaPerIteration } of objects) {
    tableData.push([
      name,
      countDeltaPerIteration,
      '+' + prettyBytes(retainedSizeDeltaPerIteration)
    ])
  }
  return `
Leaking objects:

${markdownTable(tableData)}
      `.trim() + '\n\n'
}

function formatLeakingEventListeners (listenerSummaries, eventListenersSummary) {
  const tableData = [[
    'Event',
    '# added',
    'Nodes'
  ]]

  for (const { type, deltaPerIteration, leakingNodes } of listenerSummaries) {
    const nodesFormatted = leakingNodes.map(({ description, nodeCountDeltaPerIteration }) => {
      return `${description}${nodeCountDeltaPerIteration !== 0 ? ` (+${nodeCountDeltaPerIteration})` : ''}`
    }).join(', ')
    tableData.push([
      type,
      deltaPerIteration,
      nodesFormatted
    ])
  }

  if (tableData.length === 1) { // no individual breakdowns, so just put the total
    tableData.push(['Total', eventListenersSummary.deltaPerIteration, '(Unknown)'])
  }

  return `
Leaking event listeners (+${eventListenersSummary.deltaPerIteration} total):

${markdownTable(tableData)}
      `.trim() + '\n\n'
}

function formatLeakingDomNodes (domNodes) {
  const tableData = [[
    'Description',
    '# added'
  ]]

  for (const { description, deltaPerIteration } of domNodes.nodes) {
    tableData.push([
      description,
      deltaPerIteration
    ])
  }

  if (tableData.length === 1) { // no individual breakdowns, so just put the total
    tableData.push(['Total', domNodes.deltaPerIteration])
  }

  return `
Leaking DOM nodes (+${domNodes.deltaPerIteration} total):

${markdownTable(tableData)}
      `.trim() + '\n\n'
}

function formatLeakingCollections (leakingCollections) {
  const tableData = [[
    'Collection type',
    'Size increase',
    'Preview'
  ]]

  for (const { type, deltaPerIteration, preview } of leakingCollections) {
    tableData.push([
      type,
      deltaPerIteration,
      preview
    ])
  }
  return `
Leaking collections:

${markdownTable(tableData)}
      `.trim() + '\n\n'
}

export function formatResult ({ test, result }) {
  let str = ''

  str += `Test         : ${chalk.blue(test.description)}\n`

  if (result.failed) {
    str += `Failed       : ${result.error.message}\n${result.error.stack}\n`
    return str
  }

  let leakTables = ''
  if (result.leaks.objects.length) {
    leakTables += formatLeakingObjects(result.leaks.objects)
  }
  if (result.leaks.eventListenersSummary.delta > 0) {
    leakTables += formatLeakingEventListeners(result.leaks.eventListeners, result.leaks.eventListenersSummary)
  }
  if (result.leaks.domNodes.delta > 0) {
    leakTables += formatLeakingDomNodes(result.leaks.domNodes)
  }
  if (result.leaks.collections.length) {
    leakTables += formatLeakingCollections(result.leaks.collections)
  }

  let snapshots = ''
  if (result.before.heapsnapshot && result.after.heapsnapshot) {
    snapshots = '\n' + `
Before: ${result.before.heapsnapshot} (${chalk.blue(prettyBytes(result.before.statistics.total))})
After : ${result.after.heapsnapshot} (${chalk.red(prettyBytes(result.after.statistics.total))}) (${result.numIterations} iterations)
      `.trim()
  }

  str += `
Memory change: ${result.deltaPerIteration > 0 ? chalk.red('+' + prettyBytes(result.deltaPerIteration)) : chalk.green(prettyBytes(result.deltaPerIteration))}
Leak detected: ${result.leaks.detected ? chalk.red('Yes') : chalk.green('No')}

${leakTables}
${snapshots}
    `.trim()

  return str
}
