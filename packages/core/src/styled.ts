import {
  ComponentObjectPropsOptions,
  ExtractPropTypes,
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'
import domElements, { type SupportedHTMLElements } from '@/src/constants/domElements'
import { type ExpressionType, generateClassName, generateComponentName, insertExpressions, injectStyle, removeStyle } from '@/src/utils'
import { isStyledComponent, isValidElementType, isVueComponent } from '@/src/helper'
import { DefaultTheme } from './providers/theme'

type Attrs = Record<string, any>

type BaseContext<T> = T & { theme: DefaultTheme }
type PropsDefinition<T> = {
  [K in keyof T]: T[K]
}
function baseStyled<T extends object>(target: string | InstanceType<any>, propsDefinition?: PropsDefinition<T>) {
  if (!isValidElementType(target)) {
    throw Error('The element is invalid.')
  }
  let attributes: Attrs = {}
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

  styledComponent.attrs = function <A extends Attrs = Record<string, any>>(attrs: A) {
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
        const myAttrs = ref({ class: '', ...attributes })
        const theme = inject<Record<string, string | number>>('$theme', reactive({}))
        let context = {
          theme,
          ...props,
          ...props.props,
        }

        const defaultClassName = generateClassName()

        myAttrs.value.class += ` ${defaultClassName}`

        // Inject the tailwind classes to the class attribute
        watch(
          tailwindClasses,
          (classNames) => {
            myAttrs.value.class += ` ${defaultClassName} ${classNames.join(' ')}`
          },
          { deep: true },
        )

        watch(
          [theme, props],
          () => {
            context = {
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
              ...myAttrs.value,
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

  return styledComponent
}

/** Append all the supported HTML elements to the styled properties */
const styled = baseStyled as typeof baseStyled & {
  [E in SupportedHTMLElements]: ReturnType<typeof baseStyled>
}

domElements.forEach((domElement: SupportedHTMLElements) => {
  styled[domElement] = baseStyled(domElement)
})

export { styled }