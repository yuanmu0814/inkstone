import { beforeAll, describe, expect, it } from 'vitest'
import { initI18n } from '../i18n'
import { decodeDataValue } from './data-attr'
import { enhancePreview } from './enhance'
import { renderMarkdown, renderMarkdownBlocks } from './renderer'

beforeAll(async () => {
  await initI18n()
})

describe('LaTeX math delimiters', () => {
  it('renders parenthesized inline math and bracketed display math through KaTeX', async () => {
    const source = String.raw`Using \(\overline{\mathbf P}\) as a reference.

\[ \mathcal H\boldsymbol\psi_\nu=\lambda_\nu\boldsymbol\psi_\nu \]

The mode \(\boldsymbol\psi_\nu\) has an amplitude.`
    const rendered = renderMarkdown(source)
    expect(rendered.hasMath).toBe(true)

    const root = document.createElement('div')
    root.innerHTML = rendered.html
    expect([...root.querySelectorAll<HTMLElement>('.math-inline')].map((node) =>
      decodeDataValue(node.dataset.math))).toEqual([
      String.raw`\overline{\mathbf P}`,
      String.raw`\boldsymbol\psi_\nu`,
    ])
    expect(decodeDataValue(root.querySelector<HTMLElement>('.math-block')!.dataset.math))
      .toBe(String.raw`\mathcal H\boldsymbol\psi_\nu=\lambda_\nu\boldsymbol\psi_\nu`)

    await enhancePreview(root, { math: true, mermaid: false, dark: false })
    expect(root.querySelectorAll('.katex')).toHaveLength(3)
    expect(root.querySelector('.math-block .katex-display')).not.toBeNull()
  })

  it('supports multiline display math in both reading and live-preview blocks', () => {
    const source = String.raw`\[
\Delta\mathbf P(\mathbf r,t)=\sum_\nu q_\nu(t)\boldsymbol\psi_\nu(\mathbf r)
\]`
    const rendered = renderMarkdown(source)
    const root = document.createElement('div')
    root.innerHTML = rendered.html
    expect(decodeDataValue(root.querySelector<HTMLElement>('.math-block')!.dataset.math))
      .toBe(String.raw`\Delta\mathbf P(\mathbf r,t)=\sum_\nu q_\nu(t)\boldsymbol\psi_\nu(\mathbf r)`)

    const blocks = renderMarkdownBlocks(source).blocks
    expect(blocks).toHaveLength(1)
    expect(blocks[0]!.startLine).toBe(0)
    expect(blocks[0]!.endLine).toBe(3)
    expect(blocks[0]!.html).toContain('math-block')
  })

  it('leaves unmatched delimiters and code spans unchanged', () => {
    const source = String.raw`Unmatched \(x and \[y` + '\n\n' + 'Code `\\(\\mathbf P\\)` is not math.'
    const rendered = renderMarkdown(source)
    expect(rendered.hasMath).toBe(false)
    expect(rendered.html).not.toContain('data-math')
  })

  it('keeps dollar delimiters working', () => {
    const rendered = renderMarkdown('$x^2$' + '\n\n' + '$$y^2$$')
    const root = document.createElement('div')
    root.innerHTML = rendered.html
    expect(root.querySelectorAll('.math-inline')).toHaveLength(1)
    expect(root.querySelectorAll('.math-block')).toHaveLength(1)
  })
})
