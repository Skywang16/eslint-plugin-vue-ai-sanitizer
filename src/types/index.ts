import { Rule } from 'eslint';

export interface VueAiSanitizerRuleContext extends Rule.RuleContext {
  options: any[];
}

export interface VueAiSanitizerRuleModule {
  meta: Rule.RuleMetaData;
  create: (context: VueAiSanitizerRuleContext) => Rule.RuleListener;
}

export interface VueComponentNode {
  type: string;
  properties?: any[];
  body?: any;
  children?: any[];
}

export interface VueSetupFunctionNode {
  type: string;
  body: any;
  params?: any[];
}

export interface VueEffectNode {
  type: string;
  callee: {
    name?: string;
    type: string;
    object?: {
      name?: string;
    };
    property?: {
      name?: string;
    };
  };
  arguments: any[];
}

export interface VueRefNode {
  type: string;
  callee: {
    name?: string;
    type: string;
  };
  arguments: any[];
}

export interface VuePropNode {
  type: string;
  key: {
    name?: string;
    value?: string;
  };
  value: any;
}
