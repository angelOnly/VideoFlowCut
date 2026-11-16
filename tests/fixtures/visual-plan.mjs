export const completeResearchCoverage = {
  overallVisual: 'covered', sceneComposition: 'covered', motionMechanisms: 'covered', blockingQuestions: []
};

export function visualPlan(role) {
  return {
    primaryRoles: [role],
    composition: {
      opening: `${role}建立初始画面`, primarySubject: role, supportingSubjects: [],
      spatialRelations: [{roles: [role], relation: `${role}与背景形成前后层次`}],
      textAndGraphics: '文字与主体共同构图', ending: `${role}形成最终画面`
    },
    sequence: [{purpose: '展示画面发展', subjects: [role], action: `${role}进入并持续变化`,
      retainedElements: ['文字'], transition: '保持主体接续下一场'}],
    attentionPath: [`观看中心跟随${role}`],
    odBoundaries: {locked: ['保持主体与构图'], adjustable: ['调整运动曲线'], escalation: '设计问题交视觉作者确认'}
  };
}

export function directorBrief(...plans) {
  const strings = [];
  const visit = value => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  plans.forEach(visit);
  return strings.join('\n');
}
