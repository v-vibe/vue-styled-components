import {
  type ComponentObjectPropsOptions,
  type ExtractPropTypes,
  type DefineSetupFnComponent,
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  HTMLAttributes,
} from 'vue'
import domElements, { type SupportedHTMLElements } from '@/src/constants/domElements'
import { type ExpressionType, generateClassName, generateComponentName, insertExpressions, injectStyle, removeStyle } from '@/src/utils'
import { isStyledComponent, isValidElementType, isVueComponent } from '@/src/helper'
import type { DefaultTheme } from './providers/theme'

export type BaseContext<T> = T & { theme: DefaultTheme }

export type PropsDefinition<T> = {
  [K in keyof T]: T[K]
}

// 定义 styledComponent 类型
interface StyledComponent<T extends object> {
  <P>(
    styles: TemplateStringsArray,
    ...expressions: (
      | ExpressionType<BaseContext<P & ExtractPropTypes<PropsDefinition<T>>>>
      | ExpressionType<BaseContext<P & ExtractPropTypes<PropsDefinition<T>>>>[]
    )[]
  ): DefineSetupFnComponent<{ as?: string; props?: P } & ExtractPropTypes<PropsDefinition<T>> & HTMLAttributes>

  attrs<A extends object>(attrs: A): StyledComponent<A & T>
}

function baseStyled<T extends object>(target: string | InstanceType<any>, propsDefinition?: PropsDefinition<T>): StyledComponent<T> {
  if (!isValidElementType(target)) {
    throw Error('The element is invalid.')
  }
  let attributes = {}
  function styledComponent<P>(
    styles: TemplateStringsArray,
    ...expressions: (
      | ExpressionType<BaseContext<P & ExtractPropTypes<PropsDefinition<T>>>>
      | ExpressionType<BaseContext<P & ExtractPropTypes<PropsDefinition<T>>>>[]
    )[]
  ) {
    const cssStringsWithExpression = insertExpressions(styles, expressions)
    return createStyledComponent<P>(cssStringsWithExpression)
  }

  styledComponent.attrs = function <A extends object>(attrs: A) {
    attributes = attrs
    return styledComponent
  }

  function createStyledComponent<P>(cssWithExpression: ExpressionType<any>[]) {
    let type: string = target
    if (isVueComponent(target)) {
      type = 'vue-component'
    }
    if (isStyledComponent(target)) {
      type = 'styled-component'
    }

    const componentName = generateComponentName(type)
    return defineComponent(
      (props, { slots }) => {
        const tailwindClasses = ref<string[]>([])
        const internalProps = ref({ class: '', ...attributes })
        const theme = inject<Record<string, string | number>>('$theme', reactive({}))
        let context = {
          theme,
          ...props,
          ...props.props,
          ...attributes,
        }

        const defaultClassName = generateClassName()

        internalProps.value.class += ` ${defaultClassName}`

        // Inject the tailwind classes to the class attribute
        watch(
          tailwindClasses,
          (classNames) => {
            internalProps.value.class += ` ${classNames.join(' ')}`
          },
          { deep: true },
        )

        watch(
          [theme, props],
          () => {
            context = {
              ...internalProps.value,
              theme,
              ...props,
              ...props.props,
            }
            tailwindClasses.value = injectStyle(defaultClassName, cssWithExpression, context)
          },
          {
            deep: true,
          },
        )

        onMounted(() => {
          console.log(internalProps.value)
          tailwindClasses.value = injectStyle(defaultClassName, cssWithExpression, context)
        })

        onUnmounted(() => {
          removeStyle(defaultClassName)
        })

        // Return the render function
        return () => {
          const node = isVueComponent(target) ? h(target, { as: props.as }) : props.as ?? target
          return h(
            node,
            {
              ...internalProps.value,
            },
            slots,
          )
        }
      },
      {
        name: componentName,
        props: {
          as: {
            type: String,
            required: false,
          },
          props: {
            type: Object,
            required: false,
          },
          ...propsDefinition,
        } as ComponentObjectPropsOptions<{ as?: string; props?: P } & ExtractPropTypes<PropsDefinition<T>>>,
        inheritAttrs: true,
      },
    )
  }

  return styledComponent as StyledComponent<T>
}

/** Append all the supported HTML elements to the styled properties */
const styled = baseStyled as typeof baseStyled & {
  [E in SupportedHTMLElements]: ReturnType<typeof baseStyled>
}

domElements.forEach((domElement: SupportedHTMLElements) => {
  styled[domElement] = baseStyled(domElement)
})

export { styled, styled as default }