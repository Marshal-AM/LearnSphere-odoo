'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, Trophy, GripVertical, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { createQuiz, saveQuizQuestions } from '@/lib/actions';
import type { Quiz, QuizQuestion, QuizOption } from '@/lib/types';

interface Props {
  courseId: string;
  quiz: Quiz | null;
  questions: QuizQuestion[];
}

export default function QuizBuilderClient({ courseId, quiz, questions: existingQuestions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [quizTitle, setQuizTitle] = useState(quiz?.title || 'New Quiz');
  const [quizDescription, setQuizDescription] = useState(quiz?.description || '');
  const [questions, setQuestions] = useState(
    existingQuestions.length > 0
      ? existingQuestions.map(q => ({
          id: q.id,
          text: q.question_text,
          options: q.options,
          correctIds: q.correct_answer_ids,
        }))
      : [
          {
            id: '1',
            text: '',
            options: [
              { id: 'a', text: '' },
              { id: 'b', text: '' },
            ] as QuizOption[],
            correctIds: [] as string[],
          },
        ]
  );
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [rewards, setRewards] = useState({
    first: quiz?.points_first_attempt?.toString() || '10',
    second: quiz?.points_second_attempt?.toString() || '7',
    third: quiz?.points_third_attempt?.toString() || '5',
    fourth: quiz?.points_fourth_plus_attempt?.toString() || '2',
  });

  const currentQ = questions[selectedQuestion];

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions,
      {
        id: newId,
        text: '',
        options: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
        ],
        correctIds: [],
      },
    ]);
    setSelectedQuestion(questions.length);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optionId: string, text: string) => {
    const updated = [...questions];
    updated[qIndex] = {
      ...updated[qIndex],
      options: updated[qIndex].options.map(o => (o.id === optionId ? { ...o, text } : o)),
    };
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const nextId = String.fromCharCode(97 + updated[qIndex].options.length);
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...updated[qIndex].options, { id: nextId, text: '' }],
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optionId: string) => {
    const updated = [...questions];
    updated[qIndex] = {
      ...updated[qIndex],
      options: updated[qIndex].options.filter(o => o.id !== optionId),
      correctIds: updated[qIndex].correctIds.filter(id => id !== optionId),
    };
    setQuestions(updated);
  };

  const toggleCorrect = (qIndex: number, optionId: string) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (q.correctIds.includes(optionId)) {
      q.correctIds = q.correctIds.filter(id => id !== optionId);
    } else {
      q.correctIds = [...q.correctIds, optionId];
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (selectedQuestion >= updated.length) {
      setSelectedQuestion(updated.length - 1);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      let quizId = quiz?.id;

      if (!quizId) {
        const result = await createQuiz(courseId, {
          title: quizTitle,
          description: quizDescription || undefined,
          points_first_attempt: parseInt(rewards.first) || 10,
          points_second_attempt: parseInt(rewards.second) || 7,
          points_third_attempt: parseInt(rewards.third) || 5,
          points_fourth_plus_attempt: parseInt(rewards.fourth) || 2,
        });
        quizId = result?.id;
      }

      if (quizId) {
        await saveQuizQuestions(
          quizId,
          questions.map((q, idx) => ({
            id: q.id,
            question_text: q.text,
            options: q.options,
            correct_answer_ids: q.correctIds,
            sequence_order: idx + 1,
          }))
        );
      }

      router.push(`/admin/courses/${courseId}`);
      router.refresh();
    });
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/courses/${courseId}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
            <Input
              value={quizTitle}
              onChange={e => setQuizTitle(e.target.value)}
              className="mt-1 text-sm border-none p-0 focus:ring-0"
              placeholder="Quiz title..."
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          <Sparkles className="w-4 h-4" />
          {isPending ? 'Saving...' : 'Save Quiz'}
        </Button>
      </motion.div>

      <div className="flex gap-6">
        {/* Left panel - question list */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-64 flex-shrink-0"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Questions</h3>
            <div className="space-y-1 mb-4">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestion(idx)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all duration-200 cursor-pointer',
                    selectedQuestion === idx
                      ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                  <span className="flex-1 truncate">
                    Question {idx + 1}
                    {q.text && `: ${q.text.substring(0, 20)}...`}
                  </span>
                  {q.correctIds.length > 0 && (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={addQuestion}>
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setRewardsOpen(true)}>
                <Trophy className="w-4 h-4" />
                Rewards
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main - question editor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          {currentQ && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {selectedQuestion + 1}
                </h2>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(selectedQuestion)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>

              <Textarea
                label="Question Text"
                value={currentQ.text}
                onChange={e => updateQuestion(selectedQuestion, 'text', e.target.value)}
                placeholder="Type your question here..."
                className="min-h-[80px]"
              />

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Options <span className="text-gray-400 font-normal">(click checkmark to mark correct)</span>
                  </label>
                </div>
                <div className="space-y-2">
                  {currentQ.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleCorrect(selectedQuestion, option.id)}
                        className={cn(
                          'w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer',
                          currentQ.correctIds.includes(option.id)
                            ? 'bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-500 text-white shadow-sm'
                            : 'border-gray-300 text-transparent hover:border-emerald-300 hover:text-emerald-300'
                        )}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-500 w-6">{option.id.toUpperCase()}.</span>
                      <Input
                        value={option.text}
                        onChange={e => updateOption(selectedQuestion, option.id, e.target.value)}
                        placeholder={`Option ${option.id.toUpperCase()}`}
                        className="flex-1"
                      />
                      {currentQ.options.length > 2 && (
                        <button
                          onClick={() => removeOption(selectedQuestion, option.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => addOption(selectedQuestion)}
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Rewards Modal */}
      <Modal isOpen={rewardsOpen} onClose={() => setRewardsOpen(false)} title="Quiz Rewards" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Set points based on attempt number:</p>
          <Input
            label="First attempt"
            type="number"
            value={rewards.first}
            onChange={e => setRewards({ ...rewards, first: e.target.value })}
            placeholder="10"
          />
          <Input
            label="Second attempt"
            type="number"
            value={rewards.second}
            onChange={e => setRewards({ ...rewards, second: e.target.value })}
            placeholder="7"
          />
          <Input
            label="Third attempt"
            type="number"
            value={rewards.third}
            onChange={e => setRewards({ ...rewards, third: e.target.value })}
            placeholder="5"
          />
          <Input
            label="Fourth attempt and more"
            type="number"
            value={rewards.fourth}
            onChange={e => setRewards({ ...rewards, fourth: e.target.value })}
            placeholder="2"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRewardsOpen(false)}>Cancel</Button>
            <Button onClick={() => setRewardsOpen(false)}>Save Rewards</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
