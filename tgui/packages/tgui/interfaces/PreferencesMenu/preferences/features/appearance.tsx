import {
  FeatureChoiced,
  FeatureDropdownInput,
  FeatureNumberInput,
  FeatureNumeric,
} from './base';

export const age: FeatureNumeric = {
  name: 'Age',
  component: FeatureNumberInput,
};

export const skin_tone: FeatureChoiced = {
  name: 'Skin tone',
  component: FeatureDropdownInput,
};

export const hairstyle_name: FeatureChoiced = {
  name: 'Haircut',
  component: FeatureDropdownInput,
};

export const facial_style_name: FeatureChoiced = {
  name: 'Facial hair',
  component: FeatureDropdownInput,
};

export const underwear: FeatureChoiced = {
  name: 'Underwear',
  component: FeatureDropdownInput,
};

export const undershirt: FeatureChoiced = {
  name: 'Undershirt',
  component: FeatureDropdownInput,
};

export const socks: FeatureChoiced = {
  name: 'Socks',
  component: FeatureDropdownInput,
};

export const employer: FeatureChoiced = {
  name: 'Employer',
  description: 'Your corporate employer determines which jobs you can take.',
  component: FeatureDropdownInput,
};
