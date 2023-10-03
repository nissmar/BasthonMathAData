from validation_kernel import Validation_function

validation_question_1 = Validation_function([10, -1.1, 2e5], [10, -1.1, 2e5])

validation_question_2 = Validation_function([2, -3, 0], [4, 9, 0])

validation_question_3 = Validation_function(
    [2, -3, 0], [2, 3, 0], message_succes="✅ Félicitation ! Tu as terminé le notebook"
)
