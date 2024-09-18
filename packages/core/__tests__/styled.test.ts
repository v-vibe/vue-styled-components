import { createGlobalStyle, isStyledComponent, styled } from '../index'
import { afterEach, describe, expect, it } from 'vitest'
import { render, cleanup } from '@testing-library/vue'
import { getStyle } from './utils'
import { ref } from 'vue'

describe('styled', () => {
  afterEach(() => {
    // Reset env
    cleanup()
  })

  it('should create a styled component', async () => {
    const MyComponent = {
      template: '<div>Hello World</div>',
    }

    const StyledComponent = styled(MyComponent).attrs({ 'data-testid': 'test' })`
      color: rgb(0, 0, 255);
    `

    // Is styled component
    expect(isStyledComponent(StyledComponent)).toBeTruthy()

    const instance = render(StyledComponent)
    const element = instance.getByTestId('test')

    // Is element exist
    expect(element).toBeDefined()

    // Is applied style correctly
    const style = getStyle(element)
    expect(style).toBeDefined()
    expect(style?.color).eq('rgb(0, 0, 255)')

    // Is element text content correct
    expect(element.textContent).eq('Hello World')
  })

  it('should throw error if the element is invalid', () => {
    // Mock a invalid element
    const invalidElement = 'invalid-element'

    // should throw error
    expect(() => {
      styled(invalidElement)
    }).toThrowError('The element is invalid.')
  })

  it('should style styled component', async () => {
    const StyledComponent = styled.div`
      width: 80px;
      height: 36px;
    `

    const StyledComponent2 = styled(StyledComponent).attrs({ 'data-testid': 'test' })`
      color: rgb(0, 0, 255);
      height: 44px;
    `

    const instance = render(StyledComponent2)
    const element = instance.getByTestId('test')

    // Is applied style correctly
    const style = getStyle(element)
    expect(style).toBeDefined()
    expect(style?.color).eq('rgb(0, 0, 255)')
    expect(style?.height).eq('44px')
    expect(style?.width).eq('80px')
  })

  it('should inject attrs', async () => {
    const StyledComponent = styled.div.attrs({
      'data-testid': 'test',
    })`
      height: 36px;
    `
    const instance = render(StyledComponent)
    const element = instance.getByTestId('test')

    expect(element).toBeDefined()
    expect(element.dataset['testid']).eq('test')

    const style = getStyle(element)
    expect(style?.height).eq('36px')
  })

  it('should react to props change', async () => {
    const StyledComponent = styled('div', { color: String }).attrs({ 'data-testid': 'test' })`
      color: ${(props) => props.color};
    `
    const color = ref('rgb(255, 0, 0)')
    const instance = render(StyledComponent, {
      props: { color: color.value },
    })

    const element = instance.getByTestId('test')
    const style = getStyle(element)
    expect(style?.color).eq('rgb(255, 0, 0)')

    color.value = 'rgb(0, 0, 255)'
    await instance.rerender({ color: color.value })
    const newStyle = getStyle(element)
    expect(newStyle?.color).eq('rgb(0, 0, 255)')
  })

  it('should create a global style component', async () => {
    const GlobalStyle = createGlobalStyle`
      body {
        background: rgb(255, 0, 0);
      }
    `
    const instance = render(GlobalStyle)

    expect(GlobalStyle).toBeDefined()
    expect(GlobalStyle.name).toMatch(/^styled-global.+/)

    const style = getStyle(instance.baseElement)
    expect(style?.background).toBe('rgb(255, 0, 0)')
  })
})