from validation_kernel import Validation

validation_question_1 = Validation([10, -1.1, 2e5], [10, -1.1, 2e5])

validation_question_2 = Validation([2, -3, 0], [4, 9, 0])

validation_question_3 = Validation(
    [2, -3, 0], [2, 3, 0], message_succes="✅ Félicitation ! Tu as terminé le notebook"
)
