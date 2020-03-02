import React from "react";
import { shallow } from "enzyme";

import SaveQuestionModal from "metabase/containers/SaveQuestionModal";
import Question from "metabase-lib/lib/Question";

import {
  SAMPLE_DATASET,
  ORDERS,
  PEOPLE,
  metadata,
} from "__support__/sample_dataset_fixture";

const createFnMock = jest.fn(() => Promise.resolve());
let saveFnMock;

const getSaveQuestionModal = (question, originalQuestion) => (
  <SaveQuestionModal
    card={question.card()}
    originalCard={originalQuestion && originalQuestion.card()}
    tableMetadata={question.tableMetadata()}
    createFn={createFnMock}
    saveFn={saveFnMock}
    onClose={() => {}}
  />
);

describe("SaveQuestionModal", () => {
  beforeEach(() => {
    // we need to create a new save mock before each test to ensure that each
    // test has its own instance
    saveFnMock = jest.fn(() => Promise.resolve());
  });

  it("should call createFn correctly for a new question", async () => {
    const newQuestion = Question.create({
      databaseId: SAMPLE_DATASET.id,
      tableId: ORDERS.id,
      metadata,
    })
      .query()
      .aggregate(["count"])
      .question();

    // Use the count aggregation as an example case (this is equally valid for filters and groupings)
    const component = shallow(getSaveQuestionModal(newQuestion, null));
    await component.instance().formSubmitted();
    expect(createFnMock.mock.calls.length).toBe(1);
  });
  it("should call saveFn correctly for a dirty, saved question", async () => {
    const originalQuestion = Question.create({
      databaseId: SAMPLE_DATASET.id,
      tableId: ORDERS.id,
      metadata,
    })
      .query()
      .aggregate(["count"])
      .question();
    // "Save" the question
    originalQuestion.card.id = 5;

    const dirtyQuestion = originalQuestion
      .query()
      .breakout(["field-id", ORDERS.TOTAL.id])
      .question();

    // Use the count aggregation as an example case (this is equally valid for filters and groupings)
    const component = shallow(
      getSaveQuestionModal(dirtyQuestion, originalQuestion),
    );
    await component.instance().formSubmitted();
    expect(saveFnMock.mock.calls.length).toBe(1);
  });

  it("should preserve the collection_id of a question in overwrite mode", async () => {
    let originalQuestion = Question.create({
      databaseId: SAMPLE_DATASET.id,
      tableId: PEOPLE.id,
      metadata,
    })
      .query()
      .aggregate(["count"])
      .question();

    // set the collection_id of the original question
    originalQuestion = originalQuestion.setCard({
      ...originalQuestion.card(),
      collection_id: 5,
    });

    const dirtyQuestion = originalQuestion
      .query()
      .breakout(["field-id", ORDERS.TOTAL.id])
      .question();

    const component = shallow(
      getSaveQuestionModal(dirtyQuestion, originalQuestion),
    );
    await component.instance().formSubmitted();
    expect(saveFnMock.mock.calls[0][0].collection_id).toEqual(5);
  });
});
