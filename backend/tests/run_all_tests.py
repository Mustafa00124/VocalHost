#!/usr/bin/env python3
"""
Master test runner for all WebSocket and RealtimeAgent tests
"""

import os
import sys
import subprocess
import time

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def run_test_file(test_file):
    """Run a single test file and return results"""
    print(f"\n{'='*80}")
    print(f"🧪 Running {test_file}")
    print(f"{'='*80}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run([
            sys.executable, test_file
        ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📊 Exit Code: {result.returncode}")
        
        if result.stdout:
            print("\n📤 STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("\n❌ STDERR:")
            print(result.stderr)
        
        return {
            'file': test_file,
            'exit_code': result.returncode,
            'duration': duration,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'success': result.returncode == 0
        }
        
    except Exception as e:
        print(f"❌ Error running {test_file}: {e}")
        return {
            'file': test_file,
            'exit_code': -1,
            'duration': 0,
            'stdout': '',
            'stderr': str(e),
            'success': False
        }

def main():
    """Run all tests and provide summary"""
    print("🚀 Starting Comprehensive Test Suite")
    print("=" * 80)
    
    # List of test files to run
    test_files = [
        'test_realtime_agent.py',
        'test_websocket_communication.py', 
        'test_state_updates.py'
    ]
    
    # Check if test files exist
    missing_files = []
    for test_file in test_files:
        if not os.path.exists(test_file):
            missing_files.append(test_file)
    
    if missing_files:
        print(f"❌ Missing test files: {', '.join(missing_files)}")
        return
    
    # Run all tests
    results = []
    total_start_time = time.time()
    
    for test_file in test_files:
        result = run_test_file(test_file)
        results.append(result)
    
    total_end_time = time.time()
    total_duration = total_end_time - total_start_time
    
    # Print summary
    print(f"\n{'='*80}")
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print(f"{'='*80}")
    
    successful_tests = [r for r in results if r['success']]
    failed_tests = [r for r in results if not r['success']]
    
    print(f"Total Test Files: {len(results)}")
    print(f"Successful: {len(successful_tests)}")
    print(f"Failed: {len(failed_tests)}")
    print(f"Success Rate: {(len(successful_tests) / len(results) * 100):.1f}%")
    print(f"Total Duration: {total_duration:.2f} seconds")
    
    print(f"\n📋 DETAILED RESULTS:")
    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"  {status} {result['file']} ({result['duration']:.2f}s)")
        if not result['success'] and result['stderr']:
            print(f"    Error: {result['stderr'][:100]}...")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for result in failed_tests:
            print(f"  - {result['file']}")
            if result['stderr']:
                print(f"    Error: {result['stderr']}")
    
    print(f"\n🎯 NEXT STEPS:")
    if len(successful_tests) == len(results):
        print("  🎉 All tests passed! The RealtimeAgent and WebSocket integration is working correctly.")
        print("  🚀 You can now test the full system by:")
        print("     1. Starting the backend server: python3 run.py")
        print("     2. Starting the frontend: npm run dev")
        print("     3. Opening the demo widget and testing chat functionality")
    else:
        print("  🔧 Some tests failed. Please review the errors above and fix the issues.")
        print("  📝 Common issues to check:")
        print("     - OpenAI API key configuration")
        print("     - WebSocket connection handling")
        print("     - Function tool parameter passing")
        print("     - Async/await usage in WebSocket routes")

if __name__ == '__main__':
    main()
