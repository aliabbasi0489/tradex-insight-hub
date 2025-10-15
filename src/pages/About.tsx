import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PublicHeader } from '@/components/PublicHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Brain,
  TrendingUp,
  MessageCircle,
  Activity,
  Sparkles,
  GitBranch,
} from 'lucide-react';

const initialNodes: Node[] = [
  {
    id: 'input',
    type: 'input',
    data: { label: '📊 Market Data Input' },
    position: { x: 250, y: 0 },
    style: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: '2px solid #065f46',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  },
  {
    id: 'yahoo',
    data: { label: '🌐 Yahoo Finance API' },
    position: { x: 100, y: 100 },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '2px solid #475569',
      borderRadius: '10px',
      padding: '12px',
    },
  },
  {
    id: 'binance',
    data: { label: '₿ Binance API' },
    position: { x: 400, y: 100 },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '2px solid #475569',
      borderRadius: '10px',
      padding: '12px',
    },
  },
  {
    id: 'preprocessing',
    data: { label: '⚙️ Data Preprocessing' },
    position: { x: 250, y: 200 },
    style: {
      background: '#0f172a',
      color: '#cbd5e1',
      border: '2px solid #334155',
      borderRadius: '10px',
      padding: '12px',
    },
  },
  {
    id: 'prophet',
    data: { label: '📈 Prophet Model' },
    position: { x: 50, y: 320 },
    style: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: '2px solid #1e40af',
      borderRadius: '12px',
      padding: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'lstm',
    data: { label: '🧠 LSTM Neural Network' },
    position: { x: 250, y: 320 },
    style: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      color: 'white',
      border: '2px solid #6d28d9',
      borderRadius: '12px',
      padding: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'sentiment',
    data: { label: '💭 Sentiment Analysis' },
    position: { x: 450, y: 320 },
    style: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      border: '2px solid #b45309',
      borderRadius: '12px',
      padding: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'ensemble',
    data: { label: '🎯 Ensemble Fusion' },
    position: { x: 250, y: 440 },
    style: {
      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      color: 'white',
      border: '2px solid #be185d',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  },
  {
    id: 'prediction',
    type: 'output',
    data: { label: '✨ Final Prediction' },
    position: { x: 250, y: 560 },
    style: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: '2px solid #065f46',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  },
  {
    id: 'dashboard',
    data: { label: '📱 User Dashboard' },
    position: { x: 100, y: 680 },
    style: {
      background: '#0f172a',
      color: '#cbd5e1',
      border: '2px solid #334155',
      borderRadius: '10px',
      padding: '12px',
    },
  },
  {
    id: 'alerts',
    data: { label: '🔔 Smart Alerts' },
    position: { x: 400, y: 680 },
    style: {
      background: '#0f172a',
      color: '#cbd5e1',
      border: '2px solid #334155',
      borderRadius: '10px',
      padding: '12px',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'input', target: 'yahoo', animated: true, style: { stroke: '#10b981' } },
  { id: 'e2', source: 'input', target: 'binance', animated: true, style: { stroke: '#10b981' } },
  { id: 'e3', source: 'yahoo', target: 'preprocessing', style: { stroke: '#64748b' } },
  { id: 'e4', source: 'binance', target: 'preprocessing', style: { stroke: '#64748b' } },
  {
    id: 'e5',
    source: 'preprocessing',
    target: 'prophet',
    animated: true,
    style: { stroke: '#3b82f6' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
  },
  {
    id: 'e6',
    source: 'preprocessing',
    target: 'lstm',
    animated: true,
    style: { stroke: '#8b5cf6' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
  },
  {
    id: 'e7',
    source: 'preprocessing',
    target: 'sentiment',
    animated: true,
    style: { stroke: '#f59e0b' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
  },
  { id: 'e8', source: 'prophet', target: 'ensemble', style: { stroke: '#ec4899' } },
  { id: 'e9', source: 'lstm', target: 'ensemble', style: { stroke: '#ec4899' } },
  { id: 'e10', source: 'sentiment', target: 'ensemble', style: { stroke: '#ec4899' } },
  {
    id: 'e11',
    source: 'ensemble',
    target: 'prediction',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
  },
  { id: 'e12', source: 'prediction', target: 'dashboard', style: { stroke: '#64748b' } },
  { id: 'e13', source: 'prediction', target: 'alerts', style: { stroke: '#64748b' } },
];

export default function About() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [architectureRef, architectureInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const technologies = [
    {
      icon: Brain,
      title: 'Prophet LSTM',
      description:
        'Facebook Prophet combined with Long Short-Term Memory networks for time-series forecasting',
      color: 'from-blue-500 to-purple-600',
    },
    {
      icon: MessageCircle,
      title: 'Sentiment Analysis',
      description: 'NLP-powered sentiment extraction from news, social media, and market reports',
      color: 'from-orange-500 to-amber-600',
    },
    {
      icon: Activity,
      title: 'Real-time Processing',
      description: 'Live data streams processed and analyzed in sub-second latency',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Sparkles,
      title: 'Ensemble Learning',
      description: 'Multiple models combined for superior accuracy and reliability',
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-6 px-4 py-2 text-sm">
              <GitBranch className="w-4 h-4 mr-2" />
              Advanced ML Architecture
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              The Science Behind TradeX
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Our platform combines cutting-edge machine learning techniques with real-time market data
              to deliver the most accurate stock predictions in the industry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture Diagram - Sticky */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            ref={architectureRef}
            initial={{ opacity: 0 }}
            animate={architectureInView ? { opacity: 1 } : {}}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              System
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {' '}Architecture
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interactive flow diagram showing how we process data and generate predictions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={architectureInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="sticky top-24"
          >
            <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
              <CardContent className="p-0">
                <div className="h-[800px] bg-gradient-to-br from-background via-primary/5 to-accent/5">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background color="#334155" gap={16} />
                    <Controls />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            ref={featuresRef}
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : {}}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Core
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {' '}Technologies
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The powerful technologies that drive our prediction engine
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={featuresInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full">
                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <tech.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {tech.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{tech.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              How It
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {' '}Works
              </span>
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Data Collection',
                  description:
                    'We aggregate real-time market data from multiple sources including Yahoo Finance and Binance, ensuring comprehensive coverage.',
                },
                {
                  step: '02',
                  title: 'Multi-Model Analysis',
                  description:
                    'Prophet captures seasonality and trends, LSTM learns complex patterns, and sentiment analysis gauges market psychology.',
                },
                {
                  step: '03',
                  title: 'Ensemble Fusion',
                  description:
                    'Our proprietary algorithm combines predictions from all models, weighted by their historical accuracy for specific stocks.',
                },
                {
                  step: '04',
                  title: 'Actionable Insights',
                  description:
                    'Predictions are delivered through an intuitive dashboard with alerts, charts, and AI-powered recommendations.',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 TradeX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
