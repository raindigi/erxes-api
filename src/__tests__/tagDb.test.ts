import { engageMessageFactory, tagsFactory } from '../db/factories';
import { EngageMessages, Tags } from '../db/models';

import './setup.ts';

describe('Test tags model', () => {
  let _tag;
  let _tag2;
  let _message;

  beforeEach(async () => {
    // Creating test data
    _tag = await tagsFactory({});
    _tag2 = await tagsFactory({});
    _message = await engageMessageFactory({});
  });

  afterEach(async () => {
    // Clearing test data
    await Tags.deleteMany({});
    await EngageMessages.deleteMany({});
  });

  test('Validate unique tag', async () => {
    const empty = await Tags.validateUniqueness({}, '', '');

    const selectTag = await Tags.validateUniqueness({ type: _tag2.type }, 'new tag', _tag2.type);

    const existing = await Tags.validateUniqueness({}, _tag.name, _tag.type);

    expect(empty).toEqual(true);
    expect(selectTag).toEqual(false);
    expect(existing).toEqual(false);
  });

  test('Tag not found', async () => {
    expect.assertions(1);
    try {
      await Tags.tagObject({
        tagIds: [_tag._id],
        objectIds: [],
        collection: EngageMessages,
        tagType: 'customer',
      });
    } catch (e) {
      expect(e.message).toEqual('Tag not found.');
    }
  });

  test('Attach tag type', async () => {
    Tags.tagsTag('customer', [], []);
  });

  test('Create tag check duplicated', async () => {
    expect.assertions(1);
    try {
      await Tags.createTag(_tag2);
    } catch (e) {
      expect(e.message).toEqual('Tag duplicated');
    }
  });

  test('Update tag check duplicated', async () => {
    expect.assertions(1);
    try {
      await Tags.updateTag(_tag2._id, { name: _tag.name, type: _tag.type });
    } catch (e) {
      expect(e.message).toEqual('Tag duplicated');
    }
  });

  test('Create tag', async () => {
    const tagObj = await Tags.createTag({
      name: `${_tag.name}1`,
      type: _tag.type,
      colorCode: _tag.colorCode,
    });

    expect(tagObj).toBeDefined();
    expect(tagObj.name).toEqual(`${_tag.name}1`);
    expect(tagObj.type).toEqual(_tag.type);
    expect(tagObj.colorCode).toEqual(_tag.colorCode);
  });

  test('Update tag', async () => {
    const tagObj = await Tags.updateTag(_tag._id, {
      name: _tag.name,
      type: _tag.type,
      colorCode: _tag.colorCode,
    });

    expect(tagObj).toBeDefined();
    expect(tagObj.name).toEqual(_tag.name);
    expect(tagObj.type).toEqual(_tag.type);
    expect(tagObj.colorCode).toEqual(_tag.colorCode);
  });

  test('Remove tag', async () => {
    const isDeleted = await Tags.removeTag([_tag.id]);
    expect(isDeleted).toBeTruthy();
  });

  test('Tags tag', async () => {
    const type = 'engageMessage';
    const targetIds = [_message._id];
    const tagIds = [_tag._id];

    await Tags.tagsTag(type, targetIds, tagIds);

    const messageObj = await EngageMessages.findOne({ _id: _message._id });
    const tagObj = await Tags.findOne({ _id: _tag._id });

    if (!messageObj || !messageObj.tagIds) {
      throw new Error('Engage message not found');
    }

    if (!tagObj) {
      throw new Error('Tag not found');
    }

    expect(tagObj.objectCount).toBe(1);
    expect(messageObj.tagIds[0]).toEqual(_tag.id);
  });

  test('Attach company tag', async () => {
    Tags.tagsTag('company', [], []);
  });

  test('Remove tag not found', async () => {
    expect.assertions(1);
    try {
      await Tags.removeTag([_message._id]);
    } catch (e) {
      expect(e.message).toEqual('Tag not found');
    }
  });

  test("Can't remove a tag", async () => {
    expect.assertions(1);
    try {
      await EngageMessages.updateMany({ _id: _message._id }, { $set: { tagIds: [_tag._id] } });
      await Tags.removeTag([_tag._id]);
    } catch (e) {
      expect(e.message).toEqual("Can't remove a tag with tagged object(s)");
    }
  });
});
